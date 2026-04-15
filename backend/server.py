from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any
import uuid
from datetime import datetime, timezone
import pandas as pd
import io
import numpy as np

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

class BiasAnalysisResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    fairness_score: float
    gender_stats: Dict[str, Any]
    income_stats: Dict[str, Any]
    bias_alerts: List[str]
    insights: List[str]
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SampleDatasetResponse(BaseModel):
    data: List[Dict[str, Any]]
    columns: List[str]

def calculate_fairness_score(gender_disparity: float, income_disparity: float) -> float:
    """
    Calculate overall fairness score (0-100)
    Higher score = more fair
    """
    gender_fairness = max(0, 100 - (gender_disparity * 100))
    income_fairness = max(0, 100 - (income_disparity * 100))
    
    overall_score = (gender_fairness + income_fairness) / 2
    return round(overall_score, 1)

def analyze_bias(df: pd.DataFrame) -> BiasAnalysisResult:
    """
    Analyze dataset for hiring bias
    """
    bias_alerts = []
    insights = []
    
    # Gender analysis
    if 'Gender' in df.columns and 'Hired' in df.columns:
        gender_hired = df.groupby('Gender')['Hired'].agg(['sum', 'count', 'mean'])
        gender_hired['rate'] = gender_hired['mean'] * 100
        
        male_rate = gender_hired.loc['Male', 'rate'] if 'Male' in gender_hired.index else 0
        female_rate = gender_hired.loc['Female', 'rate'] if 'Female' in gender_hired.index else 0
        
        # Disparate impact ratio (80% rule)
        if male_rate > 0:
            disparate_impact = female_rate / male_rate
            if disparate_impact < 0.8:
                bias_alerts.append(f"Gender Bias Detected: Female hiring rate is {disparate_impact*100:.1f}% of male rate (should be >80%)")
                insights.append("Review hiring criteria to ensure gender neutrality")
        
        gender_disparity = abs(male_rate - female_rate) / 100
        
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
    else:
        gender_stats = {'chart_data': [], 'disparity': 0}
        gender_disparity = 0
    
    # Income analysis
    if 'Income' in df.columns and 'Hired' in df.columns:
        # Create income brackets
        df['income_bracket'] = pd.cut(df['Income'], bins=[0, 50000, 100000, float('inf')], 
                                      labels=['Low (<50k)', 'Medium (50k-100k)', 'High (>100k)'])
        
        income_hired = df.groupby('income_bracket')['Hired'].agg(['sum', 'count', 'mean'])
        income_hired['rate'] = income_hired['mean'] * 100
        
        # Check for income bias
        rates = income_hired['rate'].values
        if len(rates) > 1:
            income_disparity = (max(rates) - min(rates)) / 100
            if income_disparity > 0.3:
                bias_alerts.append(f"Income Bias Detected: {income_disparity*100:.1f}% difference in hiring rates across income levels")
                insights.append("Consider removing income-related information from initial screening")
        else:
            income_disparity = 0
        
        income_stats = {
            'chart_data': [
                {'bracket': str(idx), 'hired': int(row['sum']), 
                 'not_hired': int(row['count'] - row['sum']),
                 'rate': float(row['rate'])}
                for idx, row in income_hired.iterrows()
            ],
            'disparity': float(income_disparity)
        }
    else:
        income_stats = {'chart_data': [], 'disparity': 0}
        income_disparity = 0
    
    # Generate insights
    if not bias_alerts:
        insights.append("No significant bias detected in current analysis")
        insights.append("Continue monitoring hiring patterns regularly")
    else:
        insights.append("Implement blind resume screening to reduce unconscious bias")
        insights.append("Provide diversity training for hiring managers")
    
    insights.append("Balance training dataset to improve AI fairness")
    
    fairness_score = calculate_fairness_score(gender_disparity, income_disparity)
    
    return BiasAnalysisResult(
        fairness_score=fairness_score,
        gender_stats=gender_stats,
        income_stats=income_stats,
        bias_alerts=bias_alerts,
        insights=insights
    )

@api_router.get("/")
async def root():
    return {"message": "FairCheck AI API"}

@api_router.post("/analyze-csv", response_model=BiasAnalysisResult)
async def analyze_csv(file: UploadFile = File(...)):
    """
    Upload and analyze CSV file for bias
    """
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # Validate required columns
        required_cols = ['Hired']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Missing required columns: {missing_cols}")
        
        # Perform analysis
        result = analyze_bias(df)
        
        # Store in database
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
    """
    Return sample hiring dataset
    """
    sample_data = [
        {"Name": "John Smith", "Gender": "Male", "Age": 32, "Income": 75000, "Experience": 5, "Education": "Bachelor", "Hired": 1},
        {"Name": "Sarah Johnson", "Gender": "Female", "Age": 28, "Income": 65000, "Experience": 3, "Education": "Bachelor", "Hired": 0},
        {"Name": "Michael Brown", "Gender": "Male", "Age": 35, "Income": 85000, "Experience": 7, "Education": "Master", "Hired": 1},
        {"Name": "Emily Davis", "Gender": "Female", "Age": 30, "Income": 70000, "Experience": 4, "Education": "Bachelor", "Hired": 0},
        {"Name": "David Wilson", "Gender": "Male", "Age": 29, "Income": 72000, "Experience": 4, "Education": "Bachelor", "Hired": 1},
        {"Name": "Jessica Martinez", "Gender": "Female", "Age": 31, "Income": 68000, "Experience": 5, "Education": "Master", "Hired": 1},
        {"Name": "James Anderson", "Gender": "Male", "Age": 33, "Income": 90000, "Experience": 6, "Education": "Master", "Hired": 1},
        {"Name": "Lisa Taylor", "Gender": "Female", "Age": 27, "Income": 62000, "Experience": 3, "Education": "Bachelor", "Hired": 0},
        {"Name": "Robert Thomas", "Gender": "Male", "Age": 36, "Income": 95000, "Experience": 8, "Education": "Master", "Hired": 1},
        {"Name": "Jennifer White", "Gender": "Female", "Age": 29, "Income": 67000, "Experience": 4, "Education": "Bachelor", "Hired": 0},
        {"Name": "William Harris", "Gender": "Male", "Age": 34, "Income": 88000, "Experience": 6, "Education": "Master", "Hired": 1},
        {"Name": "Amanda Clark", "Gender": "Female", "Age": 26, "Income": 60000, "Experience": 2, "Education": "Bachelor", "Hired": 0},
        {"Name": "Christopher Lewis", "Gender": "Male", "Age": 37, "Income": 92000, "Experience": 9, "Education": "PhD", "Hired": 1},
        {"Name": "Michelle Robinson", "Gender": "Female", "Age": 32, "Income": 73000, "Experience": 5, "Education": "Master", "Hired": 1},
        {"Name": "Daniel Walker", "Gender": "Male", "Age": 30, "Income": 78000, "Experience": 5, "Education": "Bachelor", "Hired": 1},
        {"Name": "Elizabeth Hall", "Gender": "Female", "Age": 28, "Income": 64000, "Experience": 3, "Education": "Bachelor", "Hired": 0},
        {"Name": "Matthew Allen", "Gender": "Male", "Age": 31, "Income": 82000, "Experience": 6, "Education": "Master", "Hired": 1},
        {"Name": "Ashley Young", "Gender": "Female", "Age": 25, "Income": 58000, "Experience": 2, "Education": "Bachelor", "Hired": 0},
        {"Name": "Joseph King", "Gender": "Male", "Age": 38, "Income": 98000, "Experience": 10, "Education": "PhD", "Hired": 1},
        {"Name": "Stephanie Wright", "Gender": "Female", "Age": 33, "Income": 71000, "Experience": 5, "Education": "Master", "Hired": 1}
    ]
    
    columns = ["Name", "Gender", "Age", "Income", "Experience", "Education", "Hired"]
    
    return SampleDatasetResponse(data=sample_data, columns=columns)

@api_router.post("/analyze-sample", response_model=BiasAnalysisResult)
async def analyze_sample():
    """
    Analyze the sample dataset
    """
    sample_response = await get_sample_dataset()
    df = pd.DataFrame(sample_response.data)
    
    result = analyze_bias(df)
    
    # Store in database
    doc = result.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.bias_analyses.insert_one(doc)
    
    return result

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
