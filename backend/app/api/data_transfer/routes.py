from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import get_current_user_id, get_database, get_token_payload
from app.schemas.data_transfer import ALL_RESOURCES, PUBLIC_RESOURCES, ImportJSONRequest, ImportResult
from app.services.data_transfer_service import DataTransferService

router = APIRouter(tags=["Export / Import"])

_ALLOWED_MIME: dict[str, set[str]] = {
    "csv": {"text/csv", "text/plain", "application/octet-stream"},
    "excel": {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/octet-stream"},
    "pdf": {"application/pdf", "application/octet-stream"},
}


def _validate_upload(file: UploadFile, kind: str, raw: bytes) -> None:
    """Validates MIME type and file size for imported uploads."""
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    if len(raw) > max_bytes:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            f"File exceeds the {settings.max_upload_size_mb} MB upload limit.",
        )
    allowed = _ALLOWED_MIME.get(kind, set())
    # Some browsers send 'application/octet-stream' as a fallback — we allow
    # it and rely on parsing to catch actually malformed files.
    if file.content_type and file.content_type not in allowed:
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            f"Unexpected content type '{file.content_type}' for a {kind.upper()} import.",
        )


def get_service(db: AsyncSession = Depends(get_database)) -> DataTransferService:
    return DataTransferService(db)


def _require_admin_for_public_resource(resource: str, payload: dict) -> None:
    """
    Import bypasses the per-resource route (POST /companies, POST /jobs),
    calling straight into the service layer instead — which means it also
    bypasses those routes' `require_admin` dependency. Without this check,
    any authenticated user could bulk-create companies/jobs via CSV import
    even though the equivalent direct endpoint is admin-only. This closes
    that gap explicitly rather than relying on the route-level guard to
    somehow apply to a different code path.
    """
    if resource in PUBLIC_RESOURCES and payload.get("role") != "admin":
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            f"Importing '{resource}' requires an admin account — "
            f"it's a shared catalog, not per-user data.",
        )


@router.get("/export/{resource}")
async def export_resource(
    resource: str,
    format: str = Query(default="json", pattern="^(json|csv|excel|pdf)$"),
    user_id: str = Depends(get_current_user_id),
    service: DataTransferService = Depends(get_service),
):
    """
    Downloads the requesting user's data for a resource as a real file
    (Content-Disposition: attachment), not just a JSON response body — the
    frontend can point a link straight at this endpoint.
    """
    if resource not in ALL_RESOURCES:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Unknown resource '{resource}'")

    try:
        records = await service.export(resource, user_id)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))

    if format == "csv":
        body = service.to_csv_bytes(records)
        media_type = "text/csv"
        ext = "csv"
    elif format == "excel":
        body = service.to_excel_bytes(records, resource)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ext = "xlsx"
    elif format == "pdf":
        body = service.to_pdf_bytes(records, resource)
        media_type = "application/pdf"
        ext = "pdf"
    else:
        body = service.to_json_bytes(records)
        media_type = "application/json"
        ext = "json"

    filename = f"denno_{resource}.{ext}"
    return Response(
        content=body,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/import/{resource}/json", response_model=ImportResult)
async def import_resource_json(
    resource: str,
    payload: ImportJSONRequest,
    token_payload: dict = Depends(get_token_payload),
    service: DataTransferService = Depends(get_service),
):
    if resource not in ALL_RESOURCES:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Unknown resource '{resource}'")
    _require_admin_for_public_resource(resource, token_payload)

    try:
        imported, errors = await service.import_records(resource, token_payload["sub"], payload.records)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    return ImportResult(resource=resource, imported=imported, failed=len(errors), errors=errors)


@router.post("/import/{resource}/csv", response_model=ImportResult)
async def import_resource_csv(
    resource: str,
    file: UploadFile = File(...),
    token_payload: dict = Depends(get_token_payload),
    service: DataTransferService = Depends(get_service),
):
    if resource not in ALL_RESOURCES:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Unknown resource '{resource}'")
    _require_admin_for_public_resource(resource, token_payload)

    raw = await file.read()
    _validate_upload(file, "csv", raw)
    try:
        text = raw.decode("utf-8-sig")  # tolerate Excel's BOM-prefixed CSV exports
    except UnicodeDecodeError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File is not valid UTF-8 text")

    records = service.parse_csv(text, resource)
    if not records:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "CSV had no data rows")

    try:
        imported, errors = await service.import_records(resource, token_payload["sub"], records)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    return ImportResult(resource=resource, imported=imported, failed=len(errors), errors=errors)


@router.post("/import/{resource}/excel", response_model=ImportResult)
async def import_resource_excel(
    resource: str,
    file: UploadFile = File(...),
    token_payload: dict = Depends(get_token_payload),
    service: DataTransferService = Depends(get_service),
):
    """Import records from an .xlsx workbook (first sheet, first row = headers)."""
    if resource not in ALL_RESOURCES:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Unknown resource '{resource}'")
    _require_admin_for_public_resource(resource, token_payload)

    raw = await file.read()
    _validate_upload(file, "excel", raw)
    try:
        records = service.parse_excel(raw, resource)
    except Exception as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Could not parse Excel file: {e}")

    if not records:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Excel file had no data rows")

    try:
        imported, errors = await service.import_records(resource, token_payload["sub"], records)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    return ImportResult(resource=resource, imported=imported, failed=len(errors), errors=errors)


@router.post("/import/{resource}/pdf", response_model=ImportResult)
async def import_resource_pdf(
    resource: str,
    file: UploadFile = File(...),
    token_payload: dict = Depends(get_token_payload),
    service: DataTransferService = Depends(get_service),
):
    """Import records from a PDF that contains a table (first row = headers).
    Useful for round-tripping data exported via the PDF export endpoint."""
    if resource not in ALL_RESOURCES:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Unknown resource '{resource}'")
    _require_admin_for_public_resource(resource, token_payload)

    raw = await file.read()
    _validate_upload(file, "pdf", raw)
    try:
        records = service.parse_pdf(raw, resource)
    except Exception as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Could not parse PDF file: {e}")

    if not records:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "No table data found in PDF — ensure the PDF contains a proper table with a header row.",
        )

    try:
        imported, errors = await service.import_records(resource, token_payload["sub"], records)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    return ImportResult(resource=resource, imported=imported, failed=len(errors), errors=errors)
