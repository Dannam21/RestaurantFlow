import asyncio
import logging
import smtplib
from email.message import EmailMessage

from config import settings


logger = logging.getLogger(__name__)


class EmailDeliveryError(RuntimeError):
    pass


def _send_email_sync(to_email: str, subject: str, body: str) -> None:
    if not settings.smtp_host or not settings.smtp_from_email:
        raise EmailDeliveryError("SMTP is not configured")

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = (
        f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
        if settings.smtp_from_name
        else settings.smtp_from_email
    )
    message["To"] = to_email
    message.set_content(body)

    smtp_class = smtplib.SMTP_SSL if settings.smtp_use_ssl else smtplib.SMTP
    with smtp_class(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
        if settings.smtp_use_tls and not settings.smtp_use_ssl:
            smtp.starttls()
        if settings.smtp_username and settings.smtp_password:
            smtp.login(settings.smtp_username, settings.smtp_password)
        smtp.send_message(message)


async def send_customer_verification_code(to_email: str, code: str) -> None:
    if not settings.smtp_host or not settings.smtp_from_email:
        logger.info("✅ CÓDIGO PARA %s: %s (SMTP no configurado, modo desarrollo)", to_email, code)
        return

    subject = "RestaurantFlow verification code"
    body = (
        "Your RestaurantFlow verification code is "
        f"{code}. It expires in "
        f"{settings.customer_verification_code_ttl_minutes} minutes."
    )
    try:
        await asyncio.to_thread(_send_email_sync, to_email, subject, body)
    except Exception as exc:
        logger.exception("Failed to deliver verification email to=%s", to_email)
        raise EmailDeliveryError("Unable to send verification email") from exc
