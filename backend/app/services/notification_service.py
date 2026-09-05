import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from typing import List, Dict, Any
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST if hasattr(settings, 'SMTP_HOST') else None
        self.smtp_port = settings.SMTP_PORT if hasattr(settings, 'SMTP_PORT') else None
        self.smtp_user = settings.SMTP_USER if hasattr(settings, 'SMTP_USER') else None
        self.smtp_password = settings.SMTP_PASSWORD if hasattr(settings, 'SMTP_PASSWORD') else None
    
    async def send_email(self, to_email: str, subject: str, body: str, attachments: List[str] = None):
        """Send email notification"""
        if not all([self.smtp_host, self.smtp_user, self.smtp_password]):
            logger.warning("SMTP not configured. Email not sent.")
            return False
        
        try:
            msg = MIMEMultipart()
            msg['From'] = self.smtp_user
            msg['To'] = to_email
            msg['Subject'] = subject
            
            msg.attach(MIMEText(body, 'html'))
            
            # Add attachments if any
            if attachments:
                for file_path in attachments:
                    with open(file_path, 'rb') as f:
                        part = MIMEApplication(f.read(), Name=file_path.split('/')[-1])
                        part['Content-Disposition'] = f'attachment; filename="{file_path.split("/")[-1]}"'
                        msg.attach(part)
            
            server = smtplib.SMTP(self.smtp_host, self.smtp_port)
            server.starttls()
            server.login(self.smtp_user, self.smtp_password)
            server.send_message(msg)
            server.quit()
            
            logger.info(f"✅ Email sent to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Email error: {e}")
            return False
    
    async def send_high_risk_alert(self, patient_name: str, risk_score: float, doctor_email: str):
        """Send high risk alert email"""
        subject = f"⚠️ High Risk Alert: {patient_name}"
        body = f"""
        <h2>High Risk Patient Alert</h2>
        <p><strong>Patient:</strong> {patient_name}</p>
        <p><strong>Risk Score:</strong> {risk_score:.1%}</p>
        <p><strong>Risk Level:</strong> High</p>
        <p>This patient requires immediate attention.</p>
        <p>Please review and take appropriate action.</p>
        """
        return await self.send_email(doctor_email, subject, body)