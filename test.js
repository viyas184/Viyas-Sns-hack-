const http = require("http");

const cases = [
  {
    label: "APPROVED",
    body: { credit_score: 760, monthly_income: 8000, existing_debt: 600, loan_amount: 30000, employment_status: "employed" },
  },
  {
    label: "REVIEW",
    body: { credit_score: 660, monthly_income: 5000, existing_debt: 1500, loan_amount: 42000, employment_status: "self_employed" },
  },
  {
    label: "REJECTED",
    body: { credit_score: 570, monthly_income: 3200, existing_debt: 1800, loan_amount: 55000, employment_status: "unemployed" },
  },
];

let passed = 0;

function test(i) {
  if (i >= cases.length) {
    console.log(`\n✅  All ${passed}/${cases.length} tests passed.\n`);
    return;
  }
  const c    = cases[i];
  const data = JSON.stringify(c.body);

  const req = http.request(
    {
      hostname: "localhost",
      port: 8000,
      path: "/predict",
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) },
    },
    (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        const r = JSON.parse(body);
        const ok = r.decision === c.label;
        console.log(
          `[${ok ? "PASS" : "FAIL"}] ${c.label} → got: ${r.decision} | risk: ${r.risk_score} | DTI: ${r.dti_ratio}% | LTI: ${r.loan_to_income_ratio}x`
        );
        console.log(`       Explanations: ${r.explanation.length} | Insights: ${r.insights.length} | Suggestions: ${r.suggestions.length}`);
        if (ok) passed++;
        test(i + 1);
      });
    }
  );
  req.on("error", (e) => console.error("ERR", e.message));
  req.write(data);
  req.end();
}

console.log("\n─── LoanIQ API Test Suite ───\n");
test(0);
