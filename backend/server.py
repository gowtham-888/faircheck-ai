from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timezone
import pandas as pd
import io
import csv
import numpy as np
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# --- Models ---

class BiasAnalysisResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    fairness_score: float
    gender_stats: Dict[str, Any]
    income_stats: Dict[str, Any]
    age_stats: Dict[str, Any] = Field(default_factory=lambda: {'chart_data': [], 'disparity': 0})
    education_stats: Dict[str, Any] = Field(default_factory=lambda: {'chart_data': [], 'disparity': 0})
    bias_alerts: List[str]
    insights: List[str]
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SampleDatasetResponse(BaseModel):
    data: List[Dict[str, Any]]
    columns: List[str]

class ExportRequest(BaseModel):
    fairness_score: float
    gender_stats: Dict[str, Any]
    income_stats: Dict[str, Any]
    age_stats: Optional[Dict[str, Any]] = None
    education_stats: Optional[Dict[str, Any]] = None
    bias_alerts: List[str]
    insights: List[str]

class ColumnMappingRequest(BaseModel):
    csv_content: str
    mapping: Dict[str, str]  # {standard_col: user_col} e.g. {"Hired": "selected", "Gender": "sex"}

class ColumnDetectResponse(BaseModel):
    columns: List[str]
    suggested_mapping: Dict[str, str]
    needs_mapping: bool

class HistoryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    fairness_score: float
    bias_alerts: List[str]
    timestamp: str

# --- Analysis Logic ---

def calculate_fairness_score(disparities: List[float]) -> float:
    if not disparities:
        return 100.0
    fairness_values = [max(0, 100 - (d * 100)) for d in disparities]
    return round(sum(fairness_values) / len(fairness_values), 1)

def analyze_dimension(df, group_col, target_col='Hired'):
    """Generic dimension analyzer returning chart_data, disparity, and alerts."""
    chart_data = []
    disparity = 0
    alerts = []

    if group_col not in df.columns or target_col not in df.columns:
        return chart_data, disparity, alerts

    grouped = df.groupby(group_col)[target_col].agg(['sum', 'count', 'mean'])
    grouped['rate'] = grouped['mean'] * 100

    for idx, row in grouped.iterrows():
        chart_data.append({
            'label': str(idx),
            'hired': int(row['sum']),
            'not_hired': int(row['count'] - row['sum']),
            'rate': float(row['rate'])
        })

    rates = [item['rate'] for item in chart_data if item['hired'] + item['not_hired'] > 0]
    if len(rates) > 1:
        disparity = (max(rates) - min(rates)) / 100
    return chart_data, disparity, alerts

def analyze_bias(df: pd.DataFrame) -> BiasAnalysisResult:
    bias_alerts = []
    insights = []
    disparities = []

    # --- Gender Analysis ---
    gender_stats = {'chart_data': [], 'disparity': 0}
    if 'Gender' in df.columns and 'Hired' in df.columns:
        gender_hired = df.groupby('Gender')['Hired'].agg(['sum', 'count', 'mean'])
        gender_hired['rate'] = gender_hired['mean'] * 100
        male_rate = gender_hired.loc['Male', 'rate'] if 'Male' in gender_hired.index else 0
        female_rate = gender_hired.loc['Female', 'rate'] if 'Female' in gender_hired.index else 0
        if male_rate > 0:
            di = female_rate / male_rate
            if di < 0.8:
                bias_alerts.append(f"Gender Bias Detected: Female hiring rate is {di*100:.1f}% of male rate (should be >80%)")
                insights.append("Review hiring criteria to ensure gender neutrality")
        gender_disparity = abs(male_rate - female_rate) / 100
        disparities.append(gender_disparity)
        gender_stats = {
            'chart_data': [
                {'gender': 'Male', 'hired': int(gender_hired.loc['Male', 'sum']) if 'Male' in gender_hired.index else 0,
                 'not_hired': int(gender_hired.loc['Male', 'count'] - gender_hired.loc['Male', 'sum']) if 'Male' in gender_hired.index else 0,
                 'rate': float(male_rate)},
                {'gender': 'Female', 'hired': int(gender_hired.loc['Female', 'sum']) if 'Female' in gender_hired.index else 0,
                 'not_hired': int(gender_hired.loc['Female', 'count'] - gender_hired.loc['Female', 'sum']) if 'Female' in gender_hired.index else 0,
                 'rate': float(female_rate)}
            ],
            'disparity': float(gender_disparity)
        }

    # --- Income Analysis ---
    income_stats = {'chart_data': [], 'disparity': 0}
    if 'Income' in df.columns and 'Hired' in df.columns:
        df_copy = df.copy()
        df_copy['income_bracket'] = pd.cut(df_copy['Income'], bins=[0, 50000, 100000, float('inf')],
                                           labels=['Low (<50k)', 'Medium (50k-100k)', 'High (>100k)'])
        income_hired = df_copy.groupby('income_bracket')['Hired'].agg(['sum', 'count', 'mean'])
        income_hired['rate'] = income_hired['mean'] * 100
        rates = income_hired['rate'].values
        income_disparity = (max(rates) - min(rates)) / 100 if len(rates) > 1 else 0
        disparities.append(income_disparity)
        if income_disparity > 0.3:
            bias_alerts.append(f"Income Bias Detected: {income_disparity*100:.1f}% difference in hiring rates across income levels")
            insights.append("Consider removing income-related information from initial screening")
        income_stats = {
            'chart_data': [
                {'bracket': str(idx), 'hired': int(row['sum']),
                 'not_hired': int(row['count'] - row['sum']),
                 'rate': float(row['rate'])}
                for idx, row in income_hired.iterrows()
            ],
            'disparity': float(income_disparity)
        }

    # --- Age Analysis ---
    age_stats = {'chart_data': [], 'disparity': 0}
    if 'Age' in df.columns and 'Hired' in df.columns:
        df_copy = df.copy()
        df_copy['age_bracket'] = pd.cut(df_copy['Age'], bins=[0, 25, 35, 45, 100],
                                        labels=['Young (18-25)', 'Mid (26-35)', 'Senior (36-45)', 'Veteran (46+)'])
        age_hired = df_copy.groupby('age_bracket')['Hired'].agg(['sum', 'count', 'mean'])
        age_hired['rate'] = age_hired['mean'] * 100
        # Filter out empty brackets
        age_hired = age_hired[age_hired['count'] > 0]
        rates = age_hired['rate'].values
        age_disparity = (max(rates) - min(rates)) / 100 if len(rates) > 1 else 0
        disparities.append(age_disparity)
        if age_disparity > 0.3:
            bias_alerts.append(f"Age Bias Detected: {age_disparity*100:.1f}% difference in hiring rates across age groups")
            insights.append("Ensure age-neutral evaluation criteria in the hiring process")
        age_stats = {
            'chart_data': [
                {'bracket': str(idx), 'hired': int(row['sum']),
                 'not_hired': int(row['count'] - row['sum']),
                 'rate': float(row['rate'])}
                for idx, row in age_hired.iterrows()
            ],
            'disparity': float(age_disparity)
        }

    # --- Education Analysis ---
    education_stats = {'chart_data': [], 'disparity': 0}
    if 'Education' in df.columns and 'Hired' in df.columns:
        edu_hired = df.groupby('Education')['Hired'].agg(['sum', 'count', 'mean'])
        edu_hired['rate'] = edu_hired['mean'] * 100
        rates = edu_hired['rate'].values
        edu_disparity = (max(rates) - min(rates)) / 100 if len(rates) > 1 else 0
        disparities.append(edu_disparity)
        if edu_disparity > 0.4:
            bias_alerts.append(f"Education Bias Detected: {edu_disparity*100:.1f}% difference in hiring rates by education level")
            insights.append("Consider if advanced degrees are truly necessary for the role requirements")
        education_stats = {
            'chart_data': [
                {'level': str(idx), 'hired': int(row['sum']),
                 'not_hired': int(row['count'] - row['sum']),
                 'rate': float(row['rate'])}
                for idx, row in edu_hired.iterrows()
            ],
            'disparity': float(edu_disparity)
        }

    # Generate insights
    if not bias_alerts:
        insights.append("No significant bias detected in current analysis")
        insights.append("Continue monitoring hiring patterns regularly")
    else:
        insights.append("Implement blind resume screening to reduce unconscious bias")
        insights.append("Provide diversity training for hiring managers")
    insights.append("Balance training dataset to improve AI fairness")

    fairness_score = calculate_fairness_score(disparities)

    return BiasAnalysisResult(
        fairness_score=fairness_score,
        gender_stats=gender_stats,
        income_stats=income_stats,
        age_stats=age_stats,
        education_stats=education_stats,
        bias_alerts=bias_alerts,
        insights=insights
    )

# --- PDF / CSV generators ---

def generate_pdf_report(data: ExportRequest) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5*inch, bottomMargin=0.5*inch)
    story = []
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=24,
                                  textColor=colors.HexColor('#00F5FF'), spaceAfter=30, alignment=TA_CENTER, fontName='Helvetica-Bold')
    heading_style = ParagraphStyle('CustomHeading', parent=styles['Heading2'], fontSize=16,
                                    textColor=colors.HexColor('#7B61FF'), spaceAfter=12, spaceBefore=20, fontName='Helvetica-Bold')

    story.append(Paragraph("FairCheck AI - Bias Analysis Report", title_style))
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph(f"Generated: {datetime.now(timezone.utc).strftime('%B %d, %Y at %H:%M UTC')}", styles['Normal']))
    story.append(Spacer(1, 0.3*inch))

    # Fairness Score
    story.append(Paragraph("Overall Fairness Score", heading_style))
    sc = colors.HexColor('#00F5FF') if data.fairness_score >= 80 else colors.HexColor('#7B61FF') if data.fairness_score >= 50 else colors.HexColor('#FF4D6D')
    t = Table([[Paragraph(f"<font size=36 color='{sc.hexval()}'><b>{data.fairness_score}</b></font>", styles['Normal']),
                Paragraph("<b>Interpretation:</b><br/>" + ("Excellent" if data.fairness_score >= 80 else "Moderate" if data.fairness_score >= 50 else "Needs Attention"), styles['Normal'])]], colWidths=[2*inch, 4*inch])
    t.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8F9FA')), ('ALIGN', (0,0), (0,0), 'CENTER'),
                           ('VALIGN', (0,0), (-1,-1), 'MIDDLE'), ('PADDING', (0,0), (-1,-1), 12), ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#E0E0E0'))]))
    story.append(t)
    story.append(Spacer(1, 0.3*inch))

    def add_table_section(title, header_color, headers, rows_data, disparity_val):
        story.append(Paragraph(title, heading_style))
        tbl_data = [headers] + rows_data
        tbl = Table(tbl_data, colWidths=[1.5*inch]*len(headers))
        tbl.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,0), colors.HexColor(header_color)), ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
                                  ('ALIGN', (0,0), (-1,-1), 'CENTER'), ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'), ('FONTSIZE', (0,0), (-1,0), 12),
                                  ('BOTTOMPADDING', (0,0), (-1,0), 12), ('BACKGROUND', (0,1), (-1,-1), colors.beige), ('GRID', (0,0), (-1,-1), 1, colors.black)]))
        story.append(tbl)
        story.append(Paragraph(f"<i>Disparity: {disparity_val*100:.1f}%</i>", styles['Normal']))
        story.append(Spacer(1, 0.2*inch))

    if data.gender_stats and data.gender_stats.get('chart_data'):
        add_table_section("Gender Analysis", '#00F5FF', ['Gender', 'Hired', 'Not Hired', 'Rate'],
            [[i['gender'], str(i['hired']), str(i['not_hired']), f"{i['rate']:.1f}%"] for i in data.gender_stats['chart_data']], data.gender_stats['disparity'])
    if data.income_stats and data.income_stats.get('chart_data'):
        add_table_section("Income Analysis", '#7B61FF', ['Bracket', 'Hired', 'Not Hired', 'Rate'],
            [[i['bracket'], str(i['hired']), str(i['not_hired']), f"{i['rate']:.1f}%"] for i in data.income_stats['chart_data']], data.income_stats['disparity'])
    if data.age_stats and data.age_stats.get('chart_data'):
        add_table_section("Age Analysis", '#00F5FF', ['Age Group', 'Hired', 'Not Hired', 'Rate'],
            [[i['bracket'], str(i['hired']), str(i['not_hired']), f"{i['rate']:.1f}%"] for i in data.age_stats['chart_data']], data.age_stats['disparity'])
    if data.education_stats and data.education_stats.get('chart_data'):
        add_table_section("Education Analysis", '#7B61FF', ['Level', 'Hired', 'Not Hired', 'Rate'],
            [[i['level'], str(i['hired']), str(i['not_hired']), f"{i['rate']:.1f}%"] for i in data.education_stats['chart_data']], data.education_stats['disparity'])

    if data.bias_alerts:
        story.append(Paragraph("Bias Alerts", heading_style))
        for a in data.bias_alerts:
            story.append(Paragraph(f"• {a}", styles['Normal']))
            story.append(Spacer(1, 0.05*inch))
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("AI Insights & Recommendations", heading_style))
    for ins in data.insights:
        story.append(Paragraph(f"• {ins}", styles['Normal']))
        story.append(Spacer(1, 0.05*inch))
    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph("<i>FairCheck AI - Building Fair and Ethical AI Systems</i>", styles['Normal']))
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()

def generate_csv_export(data: ExportRequest) -> str:
    rows = [['FAIRCHECK AI - BIAS ANALYSIS REPORT'], ['Generated', datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')], [], ['FAIRNESS SCORE', data.fairness_score], []]
    def add_csv_section(title, headers, items, key_map):
        rows.append([title])
        rows.append(headers)
        for i in items:
            rows.append([i[k] for k in key_map])
        rows.append([])
    if data.gender_stats and data.gender_stats.get('chart_data'):
        add_csv_section('GENDER ANALYSIS', ['Gender','Hired','Not Hired','Rate'], data.gender_stats['chart_data'], ['gender','hired','not_hired','rate'])
    if data.income_stats and data.income_stats.get('chart_data'):
        add_csv_section('INCOME ANALYSIS', ['Bracket','Hired','Not Hired','Rate'], data.income_stats['chart_data'], ['bracket','hired','not_hired','rate'])
    if data.age_stats and data.age_stats.get('chart_data'):
        add_csv_section('AGE ANALYSIS', ['Age Group','Hired','Not Hired','Rate'], data.age_stats['chart_data'], ['bracket','hired','not_hired','rate'])
    if data.education_stats and data.education_stats.get('chart_data'):
        add_csv_section('EDUCATION ANALYSIS', ['Level','Hired','Not Hired','Rate'], data.education_stats['chart_data'], ['level','hired','not_hired','rate'])
    if data.bias_alerts:
        rows.append(['BIAS ALERTS'])
        for a in data.bias_alerts:
            rows.append([a])
        rows.append([])
    rows.append(['INSIGHTS'])
    for ins in data.insights:
        rows.append([ins])
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerows(rows)
    return output.getvalue()

# --- Routes ---

@api_router.get("/")
async def root():
    return {"message": "FairCheck AI API"}

@api_router.post("/analyze-csv", response_model=BiasAnalysisResult)
async def analyze_csv_endpoint(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        required_cols = ['Hired']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Missing required columns: {missing_cols}")
        result = analyze_bias(df)
        doc = result.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        await db.bias_analyses.insert_one(doc)
        return result
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="Empty CSV file")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing CSV: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid CSV file format: {str(e)}")

@api_router.get("/sample-dataset", response_model=SampleDatasetResponse)
async def get_sample_dataset():
    sample_data = [
        {"Name": "John Smith", "Gender": "Male", "Age": 32, "Income": 75000, "Experience": 5, "Education": "Bachelor", "Hired": 1},
        {"Name": "Sarah Johnson", "Gender": "Female", "Age": 28, "Income": 65000, "Experience": 3, "Education": "Bachelor", "Hired": 0},
        {"Name": "Michael Brown", "Gender": "Male", "Age": 35, "Income": 85000, "Experience": 7, "Education": "Master", "Hired": 1},
        {"Name": "Emily Davis", "Gender": "Female", "Age": 30, "Income": 70000, "Experience": 4, "Education": "Bachelor", "Hired": 0},
        {"Name": "David Wilson", "Gender": "Male", "Age": 29, "Income": 72000, "Experience": 4, "Education": "Bachelor", "Hired": 1},
        {"Name": "Jessica Martinez", "Gender": "Female", "Age": 31, "Income": 68000, "Experience": 5, "Education": "Master", "Hired": 1},
        {"Name": "James Anderson", "Gender": "Male", "Age": 33, "Income": 90000, "Experience": 6, "Education": "Master", "Hired": 1},
        {"Name": "Lisa Taylor", "Gender": "Female", "Age": 22, "Income": 42000, "Experience": 1, "Education": "Bachelor", "Hired": 0},
        {"Name": "Robert Thomas", "Gender": "Male", "Age": 41, "Income": 95000, "Experience": 8, "Education": "Master", "Hired": 1},
        {"Name": "Jennifer White", "Gender": "Female", "Age": 29, "Income": 67000, "Experience": 4, "Education": "Bachelor", "Hired": 0},
        {"Name": "William Harris", "Gender": "Male", "Age": 34, "Income": 88000, "Experience": 6, "Education": "Master", "Hired": 1},
        {"Name": "Amanda Clark", "Gender": "Female", "Age": 24, "Income": 45000, "Experience": 1, "Education": "Bachelor", "Hired": 0},
        {"Name": "Christopher Lewis", "Gender": "Male", "Age": 42, "Income": 92000, "Experience": 9, "Education": "PhD", "Hired": 1},
        {"Name": "Michelle Robinson", "Gender": "Female", "Age": 32, "Income": 73000, "Experience": 5, "Education": "Master", "Hired": 1},
        {"Name": "Daniel Walker", "Gender": "Male", "Age": 30, "Income": 78000, "Experience": 5, "Education": "Bachelor", "Hired": 1},
        {"Name": "Elizabeth Hall", "Gender": "Female", "Age": 23, "Income": 44000, "Experience": 1, "Education": "Bachelor", "Hired": 0},
        {"Name": "Matthew Allen", "Gender": "Male", "Age": 31, "Income": 82000, "Experience": 6, "Education": "Master", "Hired": 1},
        {"Name": "Ashley Young", "Gender": "Female", "Age": 25, "Income": 48000, "Experience": 2, "Education": "Bachelor", "Hired": 0},
        {"Name": "Joseph King", "Gender": "Male", "Age": 44, "Income": 98000, "Experience": 10, "Education": "PhD", "Hired": 1},
        {"Name": "Stephanie Wright", "Gender": "Female", "Age": 33, "Income": 71000, "Experience": 5, "Education": "Master", "Hired": 1},
        {"Name": "Ryan Martinez", "Gender": "Male", "Age": 23, "Income": 46000, "Experience": 1, "Education": "Bachelor", "Hired": 0},
        {"Name": "Karen Lee", "Gender": "Female", "Age": 40, "Income": 85000, "Experience": 8, "Education": "PhD", "Hired": 1},
        {"Name": "Thomas Garcia", "Gender": "Male", "Age": 36, "Income": 91000, "Experience": 7, "Education": "PhD", "Hired": 1},
        {"Name": "Nicole Adams", "Gender": "Female", "Age": 27, "Income": 55000, "Experience": 3, "Education": "Bachelor", "Hired": 0},
    ]
    columns = ["Name", "Gender", "Age", "Income", "Experience", "Education", "Hired"]
    return SampleDatasetResponse(data=sample_data, columns=columns)

@api_router.post("/analyze-sample", response_model=BiasAnalysisResult)
async def analyze_sample():
    sample_response = await get_sample_dataset()
    df = pd.DataFrame(sample_response.data)
    result = analyze_bias(df)
    doc = result.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.bias_analyses.insert_one(doc)
    return result

@api_router.get("/analysis-history")
async def get_analysis_history():
    analyses = await db.bias_analyses.find({}, {"_id": 0}).sort("timestamp", -1).to_list(50)
    return analyses

@api_router.get("/analysis/{analysis_id}")
async def get_analysis(analysis_id: str):
    analysis = await db.bias_analyses.find_one({"id": analysis_id}, {"_id": 0})
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis

@api_router.post("/export-pdf")
async def export_pdf(data: ExportRequest):
    try:
        pdf_bytes = generate_pdf_report(data)
        return Response(content=pdf_bytes, media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=faircheck-analysis-{datetime.now().strftime('%Y%m%d-%H%M%S')}.pdf"})
    except Exception as e:
        logger.error(f"Error generating PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")

@api_router.post("/export-csv")
async def export_csv_endpoint(data: ExportRequest):
    try:
        csv_content = generate_csv_export(data)
        return Response(content=csv_content, media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=faircheck-analysis-{datetime.now().strftime('%Y%m%d-%H%M%S')}.csv"})
    except Exception as e:
        logger.error(f"Error generating CSV: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating CSV: {str(e)}")

@api_router.get("/download-sample-csv")
async def download_sample_csv():
    """Download sample dataset as a CSV file"""
    sample_response = await get_sample_dataset()
    df = pd.DataFrame(sample_response.data)
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)
    return Response(
        content=csv_buffer.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=faircheck-sample-dataset.csv"}
    )

@api_router.post("/detect-columns", response_model=ColumnDetectResponse)
async def detect_columns(file: UploadFile = File(...)):
    """Read CSV headers and suggest column mapping"""
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents), nrows=0)
        user_cols = list(df.columns)

        standard_cols = {"Hired": None, "Gender": None, "Income": None, "Age": None, "Education": None}
        # Auto-detect by matching names (case-insensitive)
        for std in standard_cols:
            for uc in user_cols:
                if uc.lower().strip() == std.lower():
                    standard_cols[std] = uc
                    break
                # Common synonyms
                synonyms = {
                    "Hired": ["hired", "selected", "accepted", "outcome", "result", "decision", "status"],
                    "Gender": ["gender", "sex", "male_female", "m_f"],
                    "Income": ["income", "salary", "pay", "wage", "compensation", "earnings"],
                    "Age": ["age", "years", "candidate_age"],
                    "Education": ["education", "degree", "qualification", "edu_level", "academic"]
                }
                if uc.lower().strip() in synonyms.get(std, []):
                    standard_cols[std] = uc
                    break

        suggested = {k: v for k, v in standard_cols.items() if v is not None}
        needs_mapping = "Hired" not in suggested

        return ColumnDetectResponse(
            columns=user_cols,
            suggested_mapping=suggested,
            needs_mapping=needs_mapping
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading CSV: {str(e)}")

@api_router.post("/analyze-mapped", response_model=BiasAnalysisResult)
async def analyze_with_mapping(file: UploadFile = File(...), mapping: str = Form("")):
    """Analyze CSV with custom column mapping (mapping is JSON string)"""
    import json as json_mod
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))

        if mapping:
            col_map = json_mod.loads(mapping)
            # Rename columns: {standard_name: user_column_name}
            reverse_map = {v: k for k, v in col_map.items() if v}
            df = df.rename(columns=reverse_map)

        if 'Hired' not in df.columns:
            raise HTTPException(status_code=400, detail="No 'Hired' column mapped. Please map at least the Hired column.")

        # Ensure Hired is numeric
        df['Hired'] = pd.to_numeric(df['Hired'], errors='coerce').fillna(0).astype(int)

        result = analyze_bias(df)
        doc = result.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        await db.bias_analyses.insert_one(doc)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing mapped CSV: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error analyzing CSV: {str(e)}")

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
