/**
 * decisionEngine.js
 * Core underwriting logic — computes risk score (0–100) and decision.
 *
 * Risk Score Weights:
 *   Credit Score   35%
 *   DTI Ratio      30%
 *   Loan-to-Income 20%
 *   Employment     15%
 *
 * Decision:
 *   APPROVED  → risk_score ≤ 35
 *   REVIEW    → 35 < risk_score ≤ 65
 *   REJECTED  → risk_score > 65
 */

function creditScoreRisk(score) {
  if (score >= 800) return 0;
  if (score >= 740) return 15;
  if (score >= 680) return 35;
  if (score >= 620) return 60;
  if (score >= 580) return 80;
  return 100;
}

function dtiRisk(dti) {
  if (dti < 15) return 0;
  if (dti < 20) return 15;
  if (dti < 28) return 35;
  if (dti < 36) return 55;
  if (dti < 43) return 75;
  return 100;
}

function ltiRisk(lti) {
  if (lti < 2) return 0;
  if (lti < 3) return 20;
  if (lti < 4) return 40;
  if (lti < 5) return 65;
  return 100;
}

function employmentRisk(status) {
  const map = {
    employed:      0,
    retired:       20,
    self_employed: 45,
    unemployed:    100,
  };
  return map[status] ?? 50;
}

function computeRisk(application) {
  const { credit_score, monthly_income, existing_debt, loan_amount, employment_status } = application;
  const annualIncome = monthly_income * 12;

  const dti = (existing_debt / monthly_income) * 100;
  const lti = loan_amount / annualIncome;

  const csRisk  = creditScoreRisk(credit_score);
  const dtiRisk_ = dtiRisk(dti);
  const ltiRisk_ = ltiRisk(lti);
  const empRisk = employmentRisk(employment_status);

  const rawScore = csRisk * 0.35 + dtiRisk_ * 0.30 + ltiRisk_ * 0.20 + empRisk * 0.15;
  const risk_score = Math.max(0, Math.min(100, Math.round(rawScore)));

  let decision;
  if (risk_score <= 35)      decision = "APPROVED";
  else if (risk_score <= 65) decision = "REVIEW";
  else                       decision = "REJECTED";

  return {
    decision,
    risk_score,
    dti: Math.round(dti * 100) / 100,
    lti: Math.round(lti * 100) / 100,
    subScores: { csRisk, dtiRisk: dtiRisk_, ltiRisk: ltiRisk_, empRisk },
  };
}

module.exports = { computeRisk };
