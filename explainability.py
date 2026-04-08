"""
Explainability Engine — Generates human-readable explanations, insights,
and actionable improvement suggestions for each underwriting decision.
"""

from models import LoanApplication, EmploymentStatus


def _explain_credit_score(score: int, risk: float) -> tuple[list, list]:
    explanations, insights = [], []
    if score >= 800:
        insights.append(f"Exceptional credit score of {score} demonstrates a long history of responsible financial behavior.")
    elif score >= 740:
        insights.append(f"Very good credit score of {score} indicates reliable repayment patterns.")
    elif score >= 680:
        explanations.append(f"Fair credit score of {score} suggests some credit challenges in your history.")
        insights.append("Your credit score is below prime tier, which moderately increases perceived lending risk.")
    elif score >= 620:
        explanations.append(f"Below-average credit score of {score} signals past difficulties managing credit obligations.")
        insights.append("Lenders view scores below 650 as higher risk, making approval more difficult.")
    else:
        explanations.append(f"Low credit score of {score} indicates a significant history of missed payments or defaults.")
        insights.append("A credit score under 620 is a primary driver of loan rejection in most underwriting models.")
    return explanations, insights


def _explain_dti(dti: float, debt: float, income: float) -> tuple[list, list]:
    explanations, insights = [], []
    if dti < 15:
        insights.append(f"Excellent debt-to-income ratio of {dti:.1f}% shows strong capacity to take on new obligations.")
    elif dti < 28:
        insights.append(f"Manageable DTI of {dti:.1f}% is within acceptable lending norms.")
    elif dti < 36:
        explanations.append(f"Your debt-to-income ratio of {dti:.1f}% is moderately elevated, reducing monthly repayment capacity.")
        insights.append("A DTI between 28–36% is a caution zone — lenders prefer below 28% for the best terms.")
    elif dti < 43:
        explanations.append(f"High debt-to-income ratio of {dti:.1f}% significantly limits your ability to service additional debt.")
        insights.append("DTI above 36% is a strong negative signal; most conventional lenders cap approval at 43%.")
    else:
        explanations.append(f"Very high debt-to-income ratio of {dti:.1f}% makes it very difficult to qualify for new credit.")
        insights.append("With over 43% of income committed to existing debt, taking on more is financially unsustainable.")
    return explanations, insights


def _explain_lti(lti: float, loan: float, annual_income: float) -> tuple[list, list]:
    explanations, insights = [], []
    if lti < 2:
        insights.append(f"Loan amount of ${loan:,.0f} is well within your annual income capacity — a comfortable request.")
    elif lti < 3:
        insights.append(f"Loan-to-income ratio of {lti:.1f}x is reasonable and within standard lending limits.")
    elif lti < 4:
        explanations.append(f"Requested loan of ${loan:,.0f} is {lti:.1f}x your annual income — slightly high for your income level.")
        insights.append("Lenders prefer loan amounts under 3× annual income for a lower risk profile.")
    elif lti < 5:
        explanations.append(f"Loan amount of ${loan:,.0f} represents {lti:.1f}× your annual income, which is considerably above recommended levels.")
        insights.append("A loan-to-income ratio above 4× significantly increases default probability from a lender's perspective.")
    else:
        explanations.append(f"Requested loan of ${loan:,.0f} is {lti:.1f}× your annual income — far beyond typical affordability thresholds.")
        insights.append("Loan-to-income ratios above 5× are rarely approved and indicate the loan amount is not proportionate to earnings.")
    return explanations, insights


def _explain_employment(status: EmploymentStatus) -> tuple[list, list]:
    explanations, insights = [], []
    if status == EmploymentStatus.employed:
        insights.append("Full-time employment provides stable, predictable income — a strong positive factor.")
    elif status == EmploymentStatus.retired:
        insights.append("Retirement income (pensions, Social Security) is consistent but growth-limited.")
    elif status == EmploymentStatus.self_employed:
        explanations.append("Self-employment income is variable and harder to verify, adding moderate underwriting risk.")
        insights.append("Self-employed applicants typically need to provide 2 years of tax returns for income verification.")
    elif status == EmploymentStatus.unemployed:
        explanations.append("Unemployment is a critical risk factor — without regular income, loan repayment capacity cannot be confirmed.")
        insights.append("Most lenders require demonstrable income before approving any credit facility.")
    return explanations, insights


def _generate_suggestions(
    credit_score: int,
    dti: float,
    lti: float,
    employment_status: EmploymentStatus,
    decision: str,
) -> list:
    suggestions = []

    if decision == "APPROVED":
        suggestions.append("🎉 Congratulations! Maintain your healthy credit habits to continue enjoying favorable loan terms.")
        suggestions.append("💡 Consider shopping multiple lenders to secure the lowest possible interest rate for your profile.")
        return suggestions

    if credit_score < 740:
        suggestions.append(
            f"📈 Improve your credit score (currently {credit_score}): Pay all bills on time, reduce credit card balances below 30% of limits, "
            "and avoid opening new credit accounts for at least 6 months."
        )
    if dti >= 28:
        suggestions.append(
            f"💳 Reduce your debt-to-income ratio (currently {dti:.1f}%): Pay down high-interest debts first (avalanche method) "
            "to free up monthly cash flow before reapplying."
        )
    if lti >= 3:
        suggestions.append(
            "🏦 Consider applying for a smaller loan amount. A lower loan request relative to your income increases approval odds "
            "and reduces monthly payment burden."
        )
    if employment_status == EmploymentStatus.unemployed:
        suggestions.append(
            "💼 Securing stable employment will dramatically improve your application. "
            "Most lenders require a minimum of 3–6 months of employment history before approving credit."
        )
    if employment_status == EmploymentStatus.self_employed:
        suggestions.append(
            "📋 Prepare 2 years of certified tax returns and bank statements to strengthen income verification for self-employed applicants."
        )
    if decision == "REVIEW":
        suggestions.append(
            "🔄 A co-signer with a strong credit profile could significantly improve your chances of approval."
        )
    if decision == "REJECTED":
        suggestions.append(
            "⏰ Consider waiting 6–12 months while actively improving the factors above before reapplying. "
            "A stronger application will result in better terms and a higher approval probability."
        )

    return suggestions or ["✅ Continue maintaining your current financial profile."]


def generate_explanation(application: LoanApplication, engine_result: dict) -> dict:
    dti = engine_result["dti"]
    lti = engine_result["lti"]
    sub = engine_result["sub_scores"]
    annual_income = application.monthly_income * 12
    decision = engine_result["decision"]

    explanations, insights = [], []

    cs_exp, cs_ins = _explain_credit_score(application.credit_score, sub["credit_score_risk"])
    explanations.extend(cs_exp)
    insights.extend(cs_ins)

    dti_exp, dti_ins = _explain_dti(dti, application.existing_debt, application.monthly_income)
    explanations.extend(dti_exp)
    insights.extend(dti_ins)

    lti_exp, lti_ins = _explain_lti(lti, application.loan_amount, annual_income)
    explanations.extend(lti_exp)
    insights.extend(lti_ins)

    emp_exp, emp_ins = _explain_employment(application.employment_status)
    explanations.extend(emp_exp)
    insights.extend(emp_ins)

    suggestions = _generate_suggestions(
        application.credit_score, dti, lti, application.employment_status, decision
    )

    return {
        "explanation": explanations if explanations else ["Your application meets all primary underwriting criteria."],
        "insights": insights,
        "suggestions": suggestions,
    }
