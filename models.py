from pydantic import BaseModel, Field, field_validator
from enum import Enum
from typing import List


class EmploymentStatus(str, Enum):
    employed = "employed"
    self_employed = "self_employed"
    unemployed = "unemployed"
    retired = "retired"


class LoanApplication(BaseModel):
    credit_score: int = Field(..., ge=300, le=850, description="FICO credit score (300-850)")
    monthly_income: float = Field(..., gt=0, description="Gross monthly income in USD")
    existing_debt: float = Field(..., ge=0, description="Total existing monthly debt payments in USD")
    loan_amount: float = Field(..., gt=0, description="Requested loan amount in USD")
    employment_status: EmploymentStatus = Field(..., description="Current employment status")

    @field_validator("existing_debt")
    @classmethod
    def debt_cannot_exceed_income(cls, v, info):
        if info.data.get("monthly_income") and v >= info.data["monthly_income"]:
            raise ValueError("Existing debt cannot equal or exceed monthly income")
        return v


class UnderwritingResult(BaseModel):
    decision: str
    risk_score: int
    dti_ratio: float
    loan_to_income_ratio: float
    explanation: List[str]
    insights: List[str]
    suggestions: List[str]
