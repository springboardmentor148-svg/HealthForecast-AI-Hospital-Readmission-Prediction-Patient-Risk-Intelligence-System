import os
import random
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_APP_PASSWORD = os.getenv("EMAIL_APP_PASSWORD")


def generate_otp() -> str:
    return str(random.randint(100000, 999999))


def send_otp_email(to_email: str, otp: str):
    subject = "HealthForecastAI — Email Verification Code"
    body = f"""
Your verification code is: {otp}

This code will expire in 10 minutes.
If you did not request this, you can ignore this email.
"""
    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = EMAIL_ADDRESS
    msg["To"] = to_email

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(EMAIL_ADDRESS, EMAIL_APP_PASSWORD)
        server.sendmail(EMAIL_ADDRESS, to_email, msg.as_string())