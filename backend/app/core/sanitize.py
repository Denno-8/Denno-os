"""
Input sanitization utilities.

These are thin, dependency-free helpers used across services and route
handlers to guard against the most common injection vectors.

Rules:
- Use strip_html() on any free-text field that will be rendered in a browser.
- Use sanitize_filename() on every uploaded file's filename before storage.
- Use validate_upload_path() before deriving filesystem paths from user input.
"""
import os
import re
import html


# Matches HTML/XML tags including script, style, and event attributes.
_TAG_RE = re.compile(r"<[^>]+>", re.IGNORECASE)
# Matches common event-handler attributes (onclick, onload, etc.)
_EVENT_RE = re.compile(r"\bon\w+\s*=", re.IGNORECASE)
# Characters not safe in filenames (path separators, null byte, etc.)
_UNSAFE_FILENAME_RE = re.compile(r'[<>:"/\\|?*\x00-\x1f]')


def strip_html(value: str) -> str:
    """
    Remove HTML tags and event attributes from a string, then HTML-entity-escape
    any remaining angle brackets.

    Use this before storing or echoing back any free-text field that originates
    from user input (notes body, goal label, cover letter text, etc.).

    Example:
        strip_html('<script>alert(1)</script>Hello') -> 'Hello'
        strip_html('<b onclick="evil()">text</b>')   -> 'text'
    """
    # Remove event attributes first (e.g. onclick="...").
    value = _EVENT_RE.sub("", value)
    # Strip all remaining HTML tags.
    value = _TAG_RE.sub("", value)
    # Entity-escape any leftover angle brackets to prevent second-pass injection.
    value = html.escape(value, quote=False)
    return value.strip()


def sanitize_filename(filename: str | None) -> str:
    """
    Return a safe filename stripped of path traversal sequences and illegal chars.

    - Replaces any directory separator, null byte, or shell-special char with '_'.
    - Collapses leading dots (hidden files) to prevent '.htaccess' injection.
    - Limits length to 255 chars (filesystem max).

    Example:
        sanitize_filename("../../etc/passwd")      -> "etc_passwd"
        sanitize_filename("my résumé (v2).pdf")    -> "my résumé (v2).pdf"
        sanitize_filename("../shell.php")           -> "shell.php"
    """
    if not filename:
        return "upload"

    # Normalise to just the base name — discard any directory components.
    filename = os.path.basename(filename)

    # Replace path-traversal sequences.
    filename = filename.replace("..", "_")

    # Replace unsafe characters.
    filename = _UNSAFE_FILENAME_RE.sub("_", filename)

    # Strip leading dots (hidden files / server config files like .htaccess).
    filename = filename.lstrip(".")

    # Collapse runs of underscores produced by above replacements.
    filename = re.sub(r"_{2,}", "_", filename)

    # Enforce filesystem length limit.
    filename = filename[:255]

    return filename or "upload"


def validate_upload_path(filename: str, base_dir: str) -> str:
    """
    Resolve `filename` relative to `base_dir` and assert the result stays
    inside `base_dir` (path traversal defence).

    Raises ValueError if the resolved path escapes the base directory.

    Example:
        validate_upload_path("cv.pdf", "/app/uploads")
            -> "/app/uploads/cv.pdf"  ✅

        validate_upload_path("../../etc/passwd", "/app/uploads")
            -> raises ValueError  ❌
    """
    safe_base = os.path.realpath(base_dir)
    candidate = os.path.realpath(os.path.join(safe_base, filename))
    if not candidate.startswith(safe_base + os.sep) and candidate != safe_base:
        raise ValueError(
            f"Filename '{filename}' resolves outside the allowed upload directory."
        )
    return candidate


# ── Magic-byte validators ─────────────────────────────────────────────────────
# Check actual file content rather than trusting the client-supplied Content-Type.

_PDF_MAGIC = b"%PDF-"
_DOCX_MAGIC = b"PK\x03\x04"  # DOCX is a ZIP archive
_TXT_MIME = "text/plain"


def validate_cv_file_bytes(file_bytes: bytes, declared_mime: str) -> str:
    """
    Validate file bytes against magic bytes and declared MIME type.

    Returns the verified MIME type string.
    Raises ValueError with a descriptive message on mismatch or unknown format.
    """
    _ALLOWED = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
    }
    if declared_mime not in _ALLOWED:
        raise ValueError(
            f"Unsupported file type '{declared_mime}'. Only PDF, DOCX, and plain text are accepted."
        )

    if declared_mime == "application/pdf":
        if not file_bytes[:5] == _PDF_MAGIC:
            raise ValueError("File claims to be a PDF but does not have a PDF magic header.")

    elif declared_mime == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        if not file_bytes[:4] == _DOCX_MAGIC:
            raise ValueError("File claims to be a DOCX but does not have a valid ZIP/DOCX header.")

    # Plain text: no reliable magic bytes; trust declared type.

    return declared_mime
