import pandas as pd
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER
import xlsxwriter
from typing import Dict, Any, List
import os
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

class ReportService:
    def __init__(self):
        self.reports_dir = "reports"
        os.makedirs(self.reports_dir, exist_ok=True)
    
    def _remove_timezone(self, dt):
        """Remove timezone from datetime objects for Excel compatibility"""
        if dt is None:
            return None
        if hasattr(dt, 'tzinfo') and dt.tzinfo is not None:
            return dt.replace(tzinfo=None)
        return dt
    
    async def generate_pdf_report(self, data: Dict[str, Any], report_type: str) -> str:
        """Generate PDF report"""
        filename = f"{self.reports_dir}/report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        try:
            doc = SimpleDocTemplate(filename, pagesize=A4)
            styles = getSampleStyleSheet()
            elements = []
            
            # Title
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                spaceAfter=30,
                alignment=TA_CENTER
            )
            elements.append(Paragraph(f"HealthForecast AI - {report_type} Report", title_style))
            elements.append(Spacer(1, 20))
            
            # Date
            elements.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
            elements.append(Spacer(1, 20))
            
            # Summary Table
            if 'summary' in data:
                elements.append(Paragraph("Executive Summary", styles['Heading2']))
                elements.append(Spacer(1, 10))
                
                summary_data = [[k.replace('_', ' ').title(), str(v)] for k, v in data['summary'].items()]
                table = Table(summary_data, colWidths=[3*inch, 2*inch])
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, -1), colors.lightgrey),
                    ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ]))
                elements.append(table)
                elements.append(Spacer(1, 20))
            
            # Patients Table
            if 'patients' in data and data['patients']:
                elements.append(Paragraph("Patient List", styles['Heading2']))
                elements.append(Spacer(1, 10))
                
                patients_data = [['Patient ID', 'Name', 'Age', 'Risk Score', 'Risk Level']]
                for p in data['patients'][:20]:
                    patients_data.append([
                        p.get('patient_id', ''),
                        p.get('name', ''),
                        str(p.get('age', '')),
                        f"{p.get('risk_score', 0):.1%}",
                        p.get('risk_category', '')
                    ])
                
                table = Table(patients_data, colWidths=[1.2*inch, 1.5*inch, 0.8*inch, 1.2*inch, 1.2*inch])
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ]))
                elements.append(table)
            
            doc.build(elements)
            logger.info(f"✅ PDF report generated: {filename}")
            return filename
            
        except Exception as e:
            logger.error(f"❌ PDF generation error: {e}")
            raise
    
    async def generate_excel_report(self, data: Dict[str, Any]) -> str:
        """Generate Excel report"""
        filename = f"{self.reports_dir}/report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        
        try:
            # Create workbook with remove_timezone option
            workbook_options = {'remove_timezone': True}
            workbook = xlsxwriter.Workbook(filename, workbook_options)
            
            # Formats
            bold = workbook.add_format({'bold': True})
            header_format = workbook.add_format({'bold': True, 'bg_color': '#D3D3D3'})
            date_format = workbook.add_format({'num_format': 'yyyy-mm-dd hh:mm'})
            
            # Summary Sheet
            summary_sheet = workbook.add_worksheet('Summary')
            
            # Write summary header
            summary_sheet.write(0, 0, 'Metric', header_format)
            summary_sheet.write(0, 1, 'Value', header_format)
            summary_sheet.set_column(0, 0, 20)
            summary_sheet.set_column(1, 1, 30)
            
            # Write summary data
            row = 1
            if 'summary' in data:
                for key, value in data['summary'].items():
                    summary_sheet.write(row, 0, key.replace('_', ' ').title())
                    summary_sheet.write(row, 1, str(value))
                    row += 1
            
            # Patients Sheet
            if 'patients' in data and data['patients']:
                patients_sheet = workbook.add_worksheet('Patients')
                
                # Headers
                headers = ['Patient ID', 'Name', 'Age', 'Gender', 'Risk Score', 'Risk Level', 'Last Admission']
                for col, header in enumerate(headers):
                    patients_sheet.write(0, col, header, header_format)
                    patients_sheet.set_column(col, col, 15)
                
                # Data - remove timezone from datetime fields
                for row, patient in enumerate(data['patients'], start=1):
                    # Remove timezone from last_admission
                    last_admission = patient.get('last_admission')
                    if last_admission:
                        last_admission = self._remove_timezone(last_admission)
                    
                    patients_sheet.write(row, 0, patient.get('patient_id', ''))
                    patients_sheet.write(row, 1, patient.get('name', ''))
                    patients_sheet.write(row, 2, patient.get('age', ''))
                    patients_sheet.write(row, 3, patient.get('gender', ''))
                    patients_sheet.write(row, 4, patient.get('risk_score', 0))
                    patients_sheet.write(row, 5, patient.get('risk_category', ''))
                    
                    # Write date with format if exists
                    if last_admission:
                        if isinstance(last_admission, datetime):
                            patients_sheet.write_datetime(row, 6, last_admission, date_format)
                        else:
                            patients_sheet.write(row, 6, str(last_admission))
                    else:
                        patients_sheet.write(row, 6, '')
            
            workbook.close()
            logger.info(f"✅ Excel report generated: {filename}")
            return filename
            
        except Exception as e:
            logger.error(f"❌ Excel generation error: {e}")
            raise