/**
 * explainability.js
 * Rule-based Explainable AI engine — generates human-readable explanations,
 * financial insights, and actionable improvement suggestions.
 */

function explainCreditScore(score) {
  const explanations = [], insights = [];
  if (score >= 800) {
    insights.push(`Exceptional credit score of ${score} demonstrates a long history of responsible financial behavior.`);
  } else if (score >= 740) {
    insights.push(`Very good credit score of ${score} indicates reliable repayment patterns.`);
  } else if (score >= 680) {
    explanations.push(`Fair credit score of ${score} suggests some credit challenges in your history.`);
    insights.push("Your credit score is below prime tier, which moderately increases perceived lending risk.");
  } else if (score >= 620) {
    explanations.push(`Below-average credit score of ${score} signals past difficulties managing credit obligations.`);
    insights.push("Lenders view scores below 650 as higher risk, making approval more difficult.");
  } else {
    explanations.push(`Low credit score of ${score} indicates a significant history of missed payments or defaults.`);
    insights.push("A credit score under 620 is a primary driver of loan rejection in most underwriting models.");
  }
  return { explanations, insights };
}

function explainDTI(dti) {
  const explanations = [], insights = [];
  if (dti < 15) {
    insights.push(`Excellent debt-to-income ratio of ${dti.toFixed(1)}% shows strong capacity to take on new obligations.`);
  } else if (dti < 28) {
    insights.push(`Manageable DTI of ${dti.toFixed(1)}% is within acceptable lending norms.`);
  } else if (dti < 36) {
    explanations.push(`Your debt-to-income ratio of ${dti.toFixed(1)}% is moderately elevated, reducing monthly repayment capacity.`);
    insights.push("A DTI between 28–36% is a caution zone — lenders prefer below 28% for the best terms.");
  } else if (dti < 43) {
    explanations.push(`High debt-to-income ratio of ${dti.toFixed(1)}% significantly limits your ability to service additional debt.`);
    insights.push("DTI above 36% is a strong negative signal; most conventional lenders cap approval at 43%.");
  } else {
    explanations.push(`Very high debt-to-income ratio of ${dti.toFixed(1)}% makes it very difficult to qualify for new credit.`);
    insights.push("With over 43% of income committed to existing debt, taking on more is financially unsustainable.");
  }
  return { explanations, insights };
}

function explainLTI(lti, loanAmount) {
  const explanations = [], insights = [];
  const loan = loanAmount.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (lti < 2) {
    insights.push(`Loan amount of $${loan} is well within your annual income capacity — a comfortable request.`);
  } else if (lti < 3) {
    insights.push(`Loan-to-income ratio of ${lti.toFixed(1)}x is reasonable and within standard lending limits.`);
  } else if (lti < 4) {
    explanations.push(`Requested loan of $${loan} is ${lti.toFixed(1)}x your annual income — slightly high for your income level.`);
    insights.push("Lenders prefer loan amounts under 3× annual income for a lower risk profile.");
  } else if (lti < 5) {
    explanations.push(`Loan amount of $${loan} represents ${lti.toFixed(1)}× your annual income, considerably above recommended levels.`);
    insights.push("A loan-to-income ratio above 4× significantly increases default probability from a lender's perspective.");
  } else {
    explanations.push(`Requested loan of $${loan} is ${lti.toFixed(1)}× your annual income — far beyond typical affordability thresholds.`);
    insights.push("Loan-to-income ratios above 5× are rarely approved and indicate the amount is not proportionate to earnings.");
  }
  return { explanations, insights };
}

function explainEmployment(status) {
  const explanations = [], insights = [];
  if (status === "employed") {
    insights.push("Full-time employment provides stable, predictable income — a strong positive factor.");
  } else if (status === "retired") {
    insights.push("Retirement income (pensions, Social Security) is consistent but growth-limited.");
  } else if (status === "self_employed") {
    explanations.push("Self-employment income is variable and harder to verify, adding moderate underwriting risk.");
    insights.push("Self-employed applicants typically need to provide 2 years of tax returns for income verification.");
  } else if (status === "unemployed") {
    explanations.push("Unemployment is a critical risk factor — without regular income, loan repayment capacity cannot be confirmed.");
    insights.push("Most lenders require demonstrable income before approving any credit facility.");
  }
  return { explanations, insights };
}

function generateSuggestions(creditScore, dti, lti, employmentStatus, decision) {
  const suggestions = [];

  if (decision === "APPROVED") {
    suggestions.push("🎉 Congratulations! Maintain your healthy credit habits to continue enjoying favorable loan terms.");
    suggestions.push("💡 Consider shopping multiple lenders to secure the lowest possible interest rate for your profile.");
    return suggestions;
  }

  if (creditScore < 740) {
    suggestions.push(
      `📈 Improve your credit score (currently ${creditScore}): Pay all bills on time, reduce credit card balances below 30% of limits, and avoid opening new credit accounts for at least 6 months.`
    );
  }
  if (dti >= 28) {
    suggestions.push(
      `💳 Reduce your debt-to-income ratio (currently ${dti.toFixed(1)}%): Pay down high-interest debts first (avalanche method) to free up monthly cash flow before reapplying.`
    );
  }
  if (lti >= 3) {
    suggestions.push(
      "🏦 Consider applying for a smaller loan amount. A lower loan request relative to your income increases approval odds and reduces monthly payment burden."
    );
  }
  if (employmentStatus === "unemployed") {
    suggestions.push(
      "💼 Securing stable employment will dramatically improve your application. Most lenders require a minimum of 3–6 months of employment history before approving credit."
    );
  }
  if (employmentStatus === "self_employed") {
    suggestions.push(
      "📋 Prepare 2 years of certified tax returns and bank statements to strengthen income verification for self-employed applicants."
    );
  }
  if (decision === "REVIEW") {
    suggestions.push(
      "🔄 A co-signer with a strong credit profile could significantly improve your chances of approval."
    );
  }
  if (decision === "REJECTED") {
    suggestions.push(
      "⏰ Consider waiting 6–12 months while actively improving the factors above before reapplying. A stronger application will result in better terms and a higher approval probability."
    );
  }

  return suggestions.length ? suggestions : ["✅ Continue maintaining your current financial profile."];
}

function generateExplanation(application, engineResult) {
  const { credit_score, monthly_income, existing_debt, loan_amount, employment_status } = application;
  const { dti, lti, decision } = engineResult;

  let allExplanations = [], allInsights = [];

  const cs  = explainCreditScore(credit_score);
  const d   = explainDTI(dti);
  const l   = explainLTI(lti, loan_amount);
  const emp = explainEmployment(employment_status);

  allExplanations = [...cs.explanations, ...d.explanations, ...l.explanations, ...emp.explanations];
  allInsights     = [...cs.insights,     ...d.insights,     ...l.insights,     ...emp.insights];

  const suggestions = generateSuggestions(credit_score, dti, lti, employment_status, decision);

  return {
    explanation: allExplanations.length ? allExplanations : ["Your application meets all primary underwriting criteria."],
    insights:    allInsights,
    suggestions,
  };
}

module.exports = { generateExplanation };
