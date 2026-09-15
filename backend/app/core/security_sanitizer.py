"""
Security Sanitizer Module for Denno Career OS.
Prevents internal Python code tracebacks, variable names, database column details,
and file path leakages from exposing to frontend clients or end-user UI toasts.
"""

import re
import logging

logger = logging.getLogger("denno.security")

# Known Python internal error signatures that should never reach end-users
INTERNAL_EXCEPTION_PATTERNS = [
    r"name ['\"]?.+['\"]? is not defined",
    r"NameError",
    r"AttributeError",
    r"TypeError",
    r"KeyError",
    r"UnboundLocalError",
    r"SyntaxError",
    r"ZeroDivisionError",
    r"IndexError",
    r"RecursionError",
    r"MemoryError",
    r"sqlalchemy\.exc",
    r"psycopg2",
    r"sqlite3\.",
    r"File \".+\", line \d+",
]

def sanitize_exception_message(exc: Exception | str, default_fallback: str = "An internal processing error occurred. Please try again or submit via official company portal.") -> str:
    """
    Sanitizes an exception or error string before returning it to the frontend.
    Logs the raw error internally for developer inspection, but returns a clean message to the client.
    """
    if exc is None:
        return default_fallback

    raw_msg = str(exc).strip()
    if not raw_msg:
        return default_fallback

    # Check if raw_msg matches any internal traceback/code patterns
    for pattern in INTERNAL_EXCEPTION_PATTERNS:
        if re.search(pattern, raw_msg, re.IGNORECASE):
            logger.warning("[SECURITY] Sanitized raw code exception leaked from backend: %s", raw_msg)
            return default_fallback

    return raw_msg
