"""
Decision Engine — Core underwriting logic.

Risk Score (0–100):  lower = less risky
  - Credit Score band  : 35% weight
  - DTI ratio band     : 30% weight
  - Loan-to-income     : 20% weight
  - Employment status  : 15% weight

Decision thresholds:
  - APPROVED  : risk_score <= 35
  - REVIEW    : 35 < risk_score <= 65
  - REJECTED  : risk_score > 65
"""

from models import LoanApplication, EmploymentStatus


def _credit_score_risk(score: int) -> float:
    """Returns a 0-100 risk contribution based on credit score."""
    if score >= 800:
        return 0
    elif score >= 740:
        return 15
    elif score >= 680:
        return 35
    elif score >= 620:
        return 60
    elif score >= 580:
        return 80
    else:
        return 100


def _dti_risk(dti: float) -> float:
    """DTI (debt-to-income) as a percentage. Returns 0-100 risk."""
    if dti < 15:
        return 0
    elif dti < 20:
        return 15
    elif dti < 28:
        return 35
    elif dti < 36:
        return 55
    elif dti < 43:
        return 75
    else:
        return 100


def _lti_risk(lti: float) -> float:
    """Loan-to-income ratio (loan / annual income). Returns 0-100 risk."""
    if lti < 2:
        return 0
    elif lti < 3:
        return 20
    elif lti < 4:
        return 40
    elif lti < 5:
        return 65
    else:
        return 100


def _employment_risk(status: EmploymentStatus) -> float:
    """Returns 0-100 risk based on employment status."""
    mapping = {
        EmploymentStatus.employed: 0,
        EmploymentStatus.retired: 20,
        EmploymentStatus.self_employed: 45,
        EmploymentStatus.unemployed: 100,
    }
    return mapping[status]


def compute_risk(application: LoanApplication) -> dict:
    """
    Compute DTI, loan-to-income, raw sub-scores, weighted risk score,
    and final decision.
    """
    monthly_income = application.monthly_income
    annual_income = monthly_income * 12

    # Core ratios
    dti = (application.existing_debt / monthly_income) * 100
    lti = application.loan_amount / annual_income

    # Sub-scores (each 0-100)
    cs_risk = _credit_score_risk(application.credit_score)
    dti_risk = _dti_risk(dti)
    lti_risk = _lti_risk(lti)
    emp_risk = _employment_risk(application.employment_status)

    # Weighted aggregate
    risk_score = round(
        cs_risk * 0.35
        + dti_risk * 0.30
        + lti_risk * 0.20
        + emp_risk * 0.15
    )
    risk_score = max(0, min(100, risk_score))

    # Decision
    if risk_score <= 35:
        decision = "APPROVED"
    elif risk_score <= 65:
        decision = "REVIEW"
    else:
        decision = "REJECTED"

    return {
        "decision": decision,
        "risk_score": risk_score,
        "dti": round(dti, 2),
        "lti": round(lti, 2),
        "sub_scores": {
            "credit_score_risk": cs_risk,
            "dti_risk": dti_risk,
            "lti_risk": lti_risk,
            "employment_risk": emp_risk,
        },
    }
