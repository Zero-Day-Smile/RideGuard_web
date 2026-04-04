from __future__ import annotations

import logging
import os
import smtplib
import ssl
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from secrets import token_urlsafe

logger = logging.getLogger(__name__)


def create_verification_token(ttl_hours: int | None = None) -> tuple[str, str]:
    token = token_urlsafe(32)
    ttl = ttl_hours if ttl_hours is not None else int(os.getenv("EMAIL_VERIFICATION_TTL_HOURS", "24"))
    expires_at = datetime.now(timezone.utc) + timedelta(hours=ttl)
    return token, expires_at.isoformat()


def build_verification_url(token: str) -> str:
    base_url = os.getenv("WEB_APP_URL", "http://localhost:5174").rstrip("/")
    path = os.getenv("EMAIL_VERIFY_PATH", "/verify-email").lstrip("/")
    return f"{base_url}/{path}?token={token}"


def send_verification_email(recipient_email: str, recipient_name: str, verification_url: str) -> bool:
    smtp_host = os.getenv("SMTP_HOST", "").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME", "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD", "").strip()
    from_email = os.getenv("SMTP_FROM_EMAIL", smtp_username or "no-reply@rideguard.dev").strip()
    use_tls = os.getenv("SMTP_USE_TLS", "true").strip().lower() not in {"0", "false", "no"}

    subject = "Verify your RideGuard account"
    text_body = (
        f"Hello {recipient_name},\n\n"
        "Verify your RideGuard account to finish registration.\n\n"
        f"Verify here: {verification_url}\n\n"
        "If you did not create this account, you can ignore this email.\n"
    )
    html_body = (
        f"<p>Hello {recipient_name},</p>"
        "<p>Verify your RideGuard account to finish registration.</p>"
        f'<p><a href="{verification_url}">Verify your email</a></p>'
        "<p>If you did not create this account, you can ignore this email.</p>"
    )

    if not smtp_host:
        logger.info("RideGuard verification link for %s: %s", recipient_email, verification_url)
        return False

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = from_email
    message["To"] = recipient_email
    message.set_content(text_body)
    message.add_alternative(html_body, subtype="html")

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as smtp:
            if use_tls:
                smtp.starttls(context=ssl.create_default_context())
            if smtp_username:
                smtp.login(smtp_username, smtp_password)
            smtp.send_message(message)
        return True
    except Exception as exc:  # pragma: no cover - best effort delivery
        logger.warning("RideGuard email delivery failed for %s: %s", recipient_email, exc)
        logger.info("RideGuard verification link for %s: %s", recipient_email, verification_url)
        return False
