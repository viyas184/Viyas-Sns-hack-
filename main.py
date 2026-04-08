from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ValidationError

from models import LoanApplication, UnderwritingResult
from decision_engine import compute_risk
from explainability import generate_explanation

app = FastAPI(
    title="LoanIQ Underwriting API",
    description="AI-powered loan underwriting engine with Explainable AI",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "LoanIQ Underwriting API v1.0"}


@app.post("/predict", response_model=UnderwritingResult, tags=["Underwriting"])
def predict(application: LoanApplication):
    """
    Evaluate a loan application and return a structured underwriting decision
    with risk score, explanation, insights, and improvement suggestions.
    """
    try:
        # Step 1: Compute risk
        engine_result = compute_risk(application)

        # Step 2: Generate explanations
        xai = generate_explanation(application, engine_result)

        # Step 3: Build response
        return UnderwritingResult(
            decision=engine_result["decision"],
            risk_score=engine_result["risk_score"],
            dti_ratio=engine_result["dti"],
            loan_to_income_ratio=engine_result["lti"],
            explanation=xai["explanation"],
            insights=xai["insights"],
            suggestions=xai["suggestions"],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CibilInput(BaseModel):
    income: float
    onTime: float
    util: float
    age: float
    score: int

@app.post("/cibil-analysis", tags=["CIBIL"])
def cibil_analysis(data: CibilInput):
    insights = []
    
    if data.score >= 750:
        insights.append("Outstanding CIBIL Score! You are eligible for prime interest rates.")
    elif data.score >= 650:
        insights.append("Good CIBIL Score. You are eligible for most loans, but rates could be better.")
    else:
        insights.append("Poor CIBIL Score. Focus on rebuilding credit before applying for large loans.")

    if data.util > 30:
        insights.append(f"Your credit utilization is high ({data.util}%). Try to keep it below 30% to rapidly improve your score.")
    if data.onTime < 100:
        insights.append("You have missed payments in the past. Payment history is the #1 factor in CIBIL; ensure 100% on-time payments going forward.")
    if data.age < 3:
        insights.append("Your credit history is relatively short. Keep accounts open to increase average account age over time.")

    return {"insights": insights}

@app.get("/wealth-tips", tags=["Wealth Hub"])
def wealth_tips():
    tips = [
        "Market Tip: Avoid trying to time the market. Dollar-cost averaging (SIPs) usually beats lump-sum investing in broad index funds.",
        "Budgeting: The 50/30/20 rule is a baseline. If you live in an expensive city, try 60/20/20, adjusting Wants down.",
        "Trading: Never risk more than 1-2% of your total trading capital on a single intraday trade."
    ]
    return {"tips": tips}
