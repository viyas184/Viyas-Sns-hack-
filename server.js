/**
 * server.js — LoanIQ Express API Server
 * POST /predict  →  Underwriting decision + XAI output
 */

const express = require("express");
const cors    = require("cors");
const { computeRisk }         = require("./decisionEngine");
const { generateExplanation } = require("./explainability");

const app  = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// ── Health check ──────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "LoanIQ Underwriting API v1.0" });
});

// ── Input validation ──────────────────────────
const VALID_EMPLOYMENT = ["employed", "self_employed", "unemployed", "retired"];

function validateInput(body) {
  const errors = [];
  const { credit_score, monthly_income, existing_debt, loan_amount, employment_status } = body;

  if (!Number.isInteger(credit_score) || credit_score < 300 || credit_score > 850)
    errors.push("credit_score must be an integer between 300 and 850.");

  if (typeof monthly_income !== "number" || monthly_income <= 0)
    errors.push("monthly_income must be a positive number.");

  if (typeof existing_debt !== "number" || existing_debt < 0)
    errors.push("existing_debt must be a non-negative number.");

  if (monthly_income > 0 && existing_debt >= monthly_income)
    errors.push("existing_debt cannot equal or exceed monthly_income.");

  if (typeof loan_amount !== "number" || loan_amount < 1000)
    errors.push("loan_amount must be at least 1000.");

  if (!VALID_EMPLOYMENT.includes(employment_status))
    errors.push(`employment_status must be one of: ${VALID_EMPLOYMENT.join(", ")}.`);

  return errors;
}

// ── POST /predict ─────────────────────────────
app.post("/predict", (req, res) => {
  const errors = validateInput(req.body);
  if (errors.length) {
    return res.status(422).json({ detail: errors.join(" ") });
  }

  try {
    const engineResult = computeRisk(req.body);
    const xai          = generateExplanation(req.body, engineResult);

    return res.json({
      decision:              engineResult.decision,
      risk_score:            engineResult.risk_score,
      dti_ratio:             engineResult.dti,
      loan_to_income_ratio:  engineResult.lti,
      sub_scores: {
        credit_score:   engineResult.subScores.csRisk,
        dti:            engineResult.subScores.dtiRisk,
        loan_to_income: engineResult.subScores.ltiRisk,
        employment:     engineResult.subScores.empRisk,
      },
      explanation:           xai.explanation,
      insights:              xai.insights,
      suggestions:           xai.suggestions,
    });
  } catch (err) {
    console.error("Engine error:", err);
    return res.status(500).json({ detail: "Internal server error." });
  }
});
// ── POST /chat (AI Assistant) ───────────────────
app.post("/chat", (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ reply: "Please provide a message." });

  const text = message.toLowerCase();
  let reply = "I'm the LoanIQ Assistant. I can help answer questions about your application, interest rates, or how our AI makes decisions.";

  if (text.includes("interest") || text.includes("rate")) {
    reply = "Interest rates are determined dynamically based on your Risk Score. A lower Risk Score qualifies you for prime rates (typically 5-8%), while higher scores may incur rates up to 25%.";
  } else if (text.includes("improve") || text.includes("score")) {
    reply = "To improve your score, focus on lowering your existing debt (which improves your DTI ratio) and maintaining a clean payment history to boost your base credit score.";
  } else if (text.includes("reject") || text.includes("why")) {
    reply = "If your application was rejected, the specific reasons are listed in our Explanation panel. Usually, it's due to high Debt-to-Income (DTI) or a low credit score.";
  } else if (text.includes("thank")) {
    reply = "You're welcome! Let me know if you need any further assistance.";
  } else if (text.includes("human") || text.includes("support")) {
    reply = "Currently, you are chatting with the AI assistant. If you need a human underwriter, please email support@loaniq.example.com.";
  }

  // Simulate slight delay to mimic LLM inference
  setTimeout(() => res.json({ reply }), 600);
});

// ── POST /cibil-analysis ──────────────────────
app.post("/cibil-analysis", (req, res) => {
  const { score, util, age, onTime } = req.body;
  const insights = [];
  
  if (score >= 750) insights.push("Outstanding CIBIL Score! You are eligible for prime interest rates.");
  else if (score >= 650) insights.push("Good CIBIL Score. You are eligible for most loans, but rates could be better.");
  else insights.push("Poor CIBIL Score. Focus on rebuilding credit before applying for large loans.");

  if (util > 30) insights.push(`Your credit utilization is high (${util}%). Try to keep it below 30% to rapidly improve your score.`);
  if (onTime < 100) insights.push("You have missed payments in the past. Payment history is the #1 factor in CIBIL; ensure 100% on-time payments going forward.");
  
  if (age < 3) insights.push("Your credit history is relatively short. Keep accounts open to increase average account age over time.");

  setTimeout(() => res.json({ insights }), 400);
});

// ── GET /wealth-tips ──────────────────────────
app.get("/wealth-tips", (req, res) => {
  const tips = [
    "Market Tip: Avoid trying to time the market. Dollar-cost averaging (SIPs) usually beats lump-sum investing in broad index funds.",
    "Budgeting: The 50/30/20 rule is a baseline. If you live in an expensive city, try 60/20/20, adjusting Wants down.",
    "Trading: Never risk more than 1-2% of your total trading capital on a single intraday trade."
  ];
  res.json({ tips });
});

// ── Start ─────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n⚡  LoanIQ API running at http://localhost:${PORT}`);
  console.log(`    POST http://localhost:${PORT}/predict\n`);
});
