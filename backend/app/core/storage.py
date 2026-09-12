"""
S3-compatible cloud storage adapter for Denno Career OS.

Supports:
  - AWS S3 (cloud)
  - MinIO (self-hosted, same S3 API)
  - Local disk fallback (when S3_ENDPOINT_URL / AWS_ACCESS_KEY_ID are not set)

Usage:
    from app.core.storage import storage
    url = await storage.upload_file("cv_123_resume.pdf", file_bytes, "application/pdf")
    data = await storage.download_file("cv_123_resume.pdf")
    await storage.delete_file("cv_123_resume.pdf")
"""
import logging
import os
from typing import Optional

from app.core.config import settings

logger = logging.getLogger("denno.storage")

# ── Local-disk helper ──────────────────────────────────────────────────────────

def _local_path(key: str) -> str:
    os.makedirs(settings.upload_dir, exist_ok=True)
    return os.path.join(settings.upload_dir, key)


def _local_url(key: str) -> str:
    """Return a URL that the FastAPI /uploads static mount serves."""
    return f"/uploads/{key}"


# ── S3 / MinIO async adapter ───────────────────────────────────────────────────

class StorageAdapter:
    """
    Unified file storage interface.
    Automatically selects S3/MinIO or local disk based on config.
    """

    @property
    def _use_s3(self) -> bool:
        return bool(settings.aws_access_key_id and settings.s3_bucket_name)

    async def upload_file(
        self,
        key: str,
        data: bytes,
        content_type: str = "application/octet-stream",
    ) -> str:
        """
        Upload bytes under ``key`` and return the accessible URL.
        Returns a presigned URL (S3) or a local /uploads path (disk).
        """
        if self._use_s3:
            return await self._s3_upload(key, data, content_type)
        return self._local_upload(key, data)

    async def download_file(self, key: str) -> Optional[bytes]:
        """
        Download file bytes by ``key``.
        Returns None if the file does not exist.
        """
        if self._use_s3:
            return await self._s3_download(key)
        return self._local_download(key)

    async def delete_file(self, key: str) -> None:
        """Delete a stored file."""
        if self._use_s3:
            await self._s3_delete(key)
        else:
            self._local_delete(key)

    async def get_presigned_url(self, key: str, expires_in: int = 3600) -> str:
        """
        Return a presigned download URL (S3/MinIO) or a local /uploads path.
        ``expires_in`` is in seconds (default 1 hour).
        """
        if self._use_s3:
            return await self._s3_presign(key, expires_in)
        return _local_url(key)

    # ── Local disk implementation ──────────────────────────────────────────────

    def _local_upload(self, key: str, data: bytes) -> str:
        path = _local_path(key)
        with open(path, "wb") as f:
            f.write(data)
        logger.debug("[Storage/local] Saved %s (%d bytes)", key, len(data))
        return _local_url(key)

    def _local_download(self, key: str) -> Optional[bytes]:
        path = _local_path(key)
        if not os.path.exists(path):
            logger.warning("[Storage/local] File not found: %s", key)
            return None
        with open(path, "rb") as f:
            return f.read()

    def _local_delete(self, key: str) -> None:
        path = _local_path(key)
        if os.path.exists(path):
            os.remove(path)
            logger.debug("[Storage/local] Deleted %s", key)

    # ── S3 / MinIO implementation ──────────────────────────────────────────────

    def _make_client(self):
        """Return a boto3 S3 client configured for S3 or MinIO."""
        import boto3  # type: ignore
        kwargs: dict = {
            "aws_access_key_id": settings.aws_access_key_id,
            "aws_secret_access_key": settings.aws_secret_access_key,
            "region_name": settings.aws_region or "us-east-1",
        }
        if settings.s3_endpoint_url:
            # MinIO or any S3-compatible endpoint
            kwargs["endpoint_url"] = settings.s3_endpoint_url
        return boto3.client("s3", **kwargs)

    async def _s3_upload(self, key: str, data: bytes, content_type: str) -> str:
        import asyncio
        loop = asyncio.get_event_loop()

        def _upload():
            client = self._make_client()
            client.put_object(
                Bucket=settings.s3_bucket_name,
                Key=key,
                Body=data,
                ContentType=content_type,
            )

        await loop.run_in_executor(None, _upload)
        logger.info("[Storage/S3] Uploaded s3://%s/%s (%d bytes)", settings.s3_bucket_name, key, len(data))
        # Return a presigned URL valid for 1 hour by default
        return await self._s3_presign(key, 3600)

    async def _s3_download(self, key: str) -> Optional[bytes]:
        import asyncio
        loop = asyncio.get_event_loop()

        def _download():
            client = self._make_client()
            try:
                obj = client.get_object(Bucket=settings.s3_bucket_name, Key=key)
                return obj["Body"].read()
            except Exception as e:
                logger.warning("[Storage/S3] Download failed for key=%s: %s", key, e)
                return None

        return await loop.run_in_executor(None, _download)

    async def _s3_delete(self, key: str) -> None:
        import asyncio
        loop = asyncio.get_event_loop()

        def _delete():
            client = self._make_client()
            client.delete_object(Bucket=settings.s3_bucket_name, Key=key)

        await loop.run_in_executor(None, _delete)
        logger.info("[Storage/S3] Deleted s3://%s/%s", settings.s3_bucket_name, key)

    async def _s3_presign(self, key: str, expires_in: int) -> str:
        import asyncio
        loop = asyncio.get_event_loop()

        def _presign():
            client = self._make_client()
            return client.generate_presigned_url(
                "get_object",
                Params={"Bucket": settings.s3_bucket_name, "Key": key},
                ExpiresIn=expires_in,
            )

        url = await loop.run_in_executor(None, _presign)
        return url


# Singleton instance — import and use directly:  from app.core.storage import storage
storage = StorageAdapter()
