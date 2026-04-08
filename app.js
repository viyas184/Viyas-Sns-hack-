/* ─────────────────────────────────────────────────
   app.js — LoanIQ Frontend Logic
   ───────────────────────────────────────────────── */

const API_URL = "http://127.0.0.1:8000/predict";

// ── Global Currency Support ─────────────────────
const currencySelector = document.getElementById("currencySelector");
let CCODE = "USD";

if (currencySelector) {
  currencySelector.addEventListener("change", (e) => {
    CCODE = e.target.value;
    calculateAffordability();
    if (typeof renderHistory === "function") renderHistory();
    const wealthInput = document.getElementById("wealthIncome");
    if (wealthInput && wealthInput.value) wealthInput.dispatchEvent(new Event("input"));
  });
}

function formatMoney(amount, maxFrac = 0) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: CCODE,
    maximumFractionDigits: maxFrac
  }).format(amount);
}

// ── DOM refs ────────────────────────────────────
const form          = document.getElementById("loanForm");
const submitBtn     = document.getElementById("submitBtn");
const resultsPanel  = document.getElementById("resultsPanel");
const loadingOverlay = document.getElementById("loadingOverlay");

// Result elements
const decisionCard   = document.getElementById("decisionCard");
const decisionIcon   = document.getElementById("decisionIcon");
const decisionIconWrap = document.getElementById("decisionIconWrap");
const decisionVerdict = document.getElementById("decisionVerdict");
const metaDTI        = document.getElementById("metaDTI");
const metaLTI        = document.getElementById("metaLTI");
const metaClass      = document.getElementById("metaClass");
const meterFill      = document.getElementById("meterFill");
const meterNeedle    = document.getElementById("meterNeedle");
const meterValue     = document.getElementById("meterValue");
const explanationList = document.getElementById("explanationList");
const insightsList   = document.getElementById("insightsList");
const suggestionsList = document.getElementById("suggestionsList");

// Loading steps
const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const step3 = document.getElementById("step3");

// Affordability elements
const estAprEl = document.getElementById("estApr");
const estMonthlyEl = document.getElementById("estMonthly");
const estInterestEl = document.getElementById("estInterest");

// Chatbot elements
const chatToggle   = document.getElementById("chatToggle");
const chatWindow   = document.getElementById("chatWindow");
const chatClose    = document.getElementById("chatClose");
const chatForm     = document.getElementById("chatForm");
const chatInput    = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");

// Tabs
const tabBtns = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

// History list
const historyList = document.getElementById("historyList");
let appHistory = [];

// ── Tabs Logic ────────────────────────────────────
tabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    tabBtns.forEach(b => b.classList.remove("active"));
    tabContents.forEach(c => {
      c.classList.remove("active");
      c.classList.add("hidden");
    });
    btn.classList.add("active");
    const target = document.getElementById(btn.dataset.tab);
    target.classList.remove("hidden");
    target.classList.add("active");
  });
});

// ── Quick-fill Presets ──────────────────────────
const PRESETS = {
  approved: {
    creditScore: 760,
    monthlyIncome: 8000,
    existingDebt: 600,
    loanAmount: 30000,
    employment: "employed",
  },
  review: {
    creditScore: 660,
    monthlyIncome: 5000,
    existingDebt: 1500,
    loanAmount: 42000,
    employment: "self_employed",
  },
  rejected: {
    creditScore: 570,
    monthlyIncome: 3200,
    existingDebt: 1800,
    loanAmount: 55000,
    employment: "unemployed",
  },
};

document.querySelectorAll(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const data = PRESETS[btn.dataset.preset];
    if (!data) return;
    document.getElementById("creditScore").value = data.creditScore;
    document.getElementById("monthlyIncome").value = data.monthlyIncome;
    document.getElementById("existingDebt").value = data.existingDebt;
    document.getElementById("loanAmount").value = data.loanAmount;
    const emp = document.getElementById(`emp-${data.employment}`);
    if (emp) emp.checked = true;
    updateScoreBar(data.creditScore);
    clearErrors();
    calculateAffordability(); // Recalculate on preset fill
  });
});

// ── Credit Score Live Bar ───────────────────────
const creditScoreInput = document.getElementById("creditScore");
const scoreBar = document.getElementById("scoreBar");
const scoreLabel = document.getElementById("scoreLabel");

creditScoreInput.addEventListener("input", () => {
  updateScoreBar(parseInt(creditScoreInput.value, 10));
});

function updateScoreBar(score) {
  if (!score || score < 300 || score > 850) {
    scoreBar.style.setProperty("--pct", "0%");
    scoreLabel.textContent = "";
    return;
  }
  const pct = ((score - 300) / 550) * 100;
  let color, label;
  if (score >= 800)      { color = "#22c55e"; label = "Exceptional"; }
  else if (score >= 740) { color = "#4ade80"; label = "Very Good"; }
  else if (score >= 680) { color = "#f59e0b"; label = "Good"; }
  else if (score >= 620) { color = "#fb923c"; label = "Fair"; }
  else                   { color = "#ef4444"; label = "Poor"; }

  scoreBar.style.setProperty("--pct", `${pct}%`);
  scoreBar.style.setProperty("--bar-color", color);
  scoreLabel.textContent = label;
  scoreLabel.style.color = color;
}

// ── Validation ──────────────────────────────────
function clearErrors() {
  ["creditScore", "monthlyIncome", "existingDebt", "loanAmount"].forEach((id) => {
    const el = document.getElementById(id);
    const err = document.getElementById(id + "Error");
    el.classList.remove("error");
    if (err) err.textContent = "";
  });
  document.getElementById("employmentError").textContent = "";
}

function showError(fieldId, message) {
  const el = document.getElementById(fieldId);
  const err = document.getElementById(fieldId + "Error");
  el.classList.add("error");
  if (err) err.textContent = message;
}

function validateForm() {
  clearErrors();
  let valid = true;

  const cs = parseInt(document.getElementById("creditScore").value, 10);
  if (!cs || cs < 300 || cs > 850) {
    showError("creditScore", "Enter a valid FICO score between 300 and 850.");
    valid = false;
  }

  const income = parseFloat(document.getElementById("monthlyIncome").value);
  if (!income || income <= 0) {
    showError("monthlyIncome", "Enter your gross monthly income.");
    valid = false;
  }

  const debt = parseFloat(document.getElementById("existingDebt").value);
  if (isNaN(debt) || debt < 0) {
    showError("existingDebt", "Enter your total monthly debt payments (0 if none).");
    valid = false;
  } else if (income > 0 && debt >= income) {
    showError("existingDebt", "Monthly debt cannot equal or exceed monthly income.");
    valid = false;
  }

  const loan = parseFloat(document.getElementById("loanAmount").value);
  if (!loan || loan < 1000) {
    showError("loanAmount", "Enter a loan amount of at least $1,000.");
    valid = false;
  }

  const emp = document.querySelector('input[name="employment"]:checked');
  if (!emp) {
    document.getElementById("employmentError").textContent = "Please select your employment status.";
    valid = false;
  }

  return valid;
}

// ── Application History ─────────────────────────
function loadHistory() {
  const stored = localStorage.getItem("loaniq_history");
  if (stored) {
    try { appHistory = JSON.parse(stored); } catch(e) {}
  }
  renderHistory();
}

function saveToHistory(payload, decisionData) {
  const item = {
    id: Date.now(),
    date: new Date().toLocaleDateString(),
    amount: payload.loan_amount,
    decision: decisionData.decision,
    score: payload.credit_score
  };
  appHistory.unshift(item);
  if (appHistory.length > 5) appHistory = appHistory.slice(0, 5); // Kept to 5 items
  localStorage.setItem("loaniq_history", JSON.stringify(appHistory));
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";
  if (appHistory.length === 0) {
    historyList.innerHTML = `<p class="text-muted" style="font-size: 0.8rem; padding: 12px;">No recent history.</p>`;
    return;
  }
  
  appHistory.forEach(item => {
    const cls = item.decision.toLowerCase();
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `
      <div>
        <div class="hi-title">${formatMoney(item.amount)} Loan</div>
        <div class="hi-sub">${item.date} • Score: ${item.score}</div>
      </div>
      <div class="hi-badge ${cls}">${item.decision.replace('_', ' ')}</div>
    `;
    div.addEventListener('click', () => {
       // Optional: populate preset based on history
       document.getElementById("loanAmount").value = item.amount;
       document.getElementById("creditScore").value = item.score;
       updateScoreBar(item.score);
       calculateAffordability();
    });
    historyList.appendChild(div);
  });
}

// ── Affordability Calculator ────────────────────
function calculateAffordability() {
  const loanAmt = parseFloat(document.getElementById("loanAmount").value);
  const score = parseInt(creditScoreInput.value, 10);
  
  if (!loanAmt || loanAmt < 1000 || !score || score < 300) {
    estAprEl.textContent = "--%";
    estMonthlyEl.textContent = "$--";
    estInterestEl.textContent = "$--";
    return;
  }
  
  // Mock APR scale: 850 score -> 4.5% APR | 300 score -> 35% APR
  let baseApr = 35 - ((score - 300) / 550) * 30.5;
  baseApr = Math.max(4.5, Math.min(baseApr, 35.0));
  
  const years = 5; // standard 5 year term demonstration
  const months = years * 12;
  const monthlyRate = (baseApr / 100) / 12;
  
  const monthlyPayment = (loanAmt * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  const totalInterest = (monthlyPayment * months) - loanAmt;
  
  estAprEl.textContent = `${baseApr.toFixed(2)}%`;
  estMonthlyEl.textContent = formatMoney(monthlyPayment, 2);
  estInterestEl.textContent = formatMoney(totalInterest, 2);
}

document.getElementById("loanAmount").addEventListener("input", calculateAffordability);
// creditScoreInput listener is added above and already triggers bar update, we'll hook afford there too:
creditScoreInput.addEventListener("input", calculateAffordability);

// ── Loading Animation ───────────────────────────
function showLoading() {
  loadingOverlay.hidden = false;
  [step1, step2, step3].forEach((s) => { s.className = "load-step"; });
  step1.classList.add("active");

  setTimeout(() => {
    step1.classList.remove("active");
    step1.classList.add("done");
    step2.classList.add("active");
  }, 700);

  setTimeout(() => {
    step2.classList.remove("active");
    step2.classList.add("done");
    step3.classList.add("active");
  }, 1400);
}

function hideLoading() {
  step3.classList.remove("active");
  step3.classList.add("done");
  setTimeout(() => { loadingOverlay.hidden = true; }, 300);
}

// ── Risk Meter Animation ────────────────────────
// The arc path is "M 20 100 A 80 80 0 0 1 180 100"
// Arc length = π × 80 = ~251.2 px
const ARC_LENGTH = 251.2;

function animateMeter(score) {
  // score 0–100 maps to dashoffset ARC_LENGTH → 0
  const offset = ARC_LENGTH - (score / 100) * ARC_LENGTH;
  meterFill.style.strokeDashoffset = offset;

  // Needle: -90deg (left, score 0) → +90deg (right, score 100)
  const angle = -90 + (score / 100) * 180;
  meterNeedle.style.transform = `rotate(${angle}deg)`;

  // Animate number counter
  let current = 0;
  const step = Math.ceil(score / 40);
  const interval = setInterval(() => {
    current = Math.min(current + step, score);
    meterValue.textContent = current;
    if (current >= score) clearInterval(interval);
  }, 25);
}

// ── Render Results ──────────────────────────────
const DECISION_CONFIG = {
  APPROVED: { cls: "approved", icon: "✅", label: "APPROVED", riskClass: "Low Risk" },
  REVIEW:   { cls: "review",   icon: "🔎", label: "UNDER REVIEW", riskClass: "Moderate Risk" },
  REJECTED: { cls: "rejected", icon: "❌", label: "REJECTED",  riskClass: "High Risk" },
};

function renderResults(data) {
  const cfg = DECISION_CONFIG[data.decision] || DECISION_CONFIG.REVIEW;

  // Decision card
  decisionCard.className = `card decision-card ${cfg.cls}`;
  decisionIcon.textContent = cfg.icon;
  decisionVerdict.textContent = cfg.label;
  metaDTI.textContent   = `${data.dti_ratio.toFixed(1)}%`;
  metaLTI.textContent   = `${data.loan_to_income_ratio.toFixed(2)}×`;
  metaClass.textContent = cfg.riskClass;

  // Meter
  animateMeter(data.risk_score);

  // Lists
  renderList(explanationList, data.explanation, "factor");
  renderList(insightsList, data.insights, "insight");
  renderList(suggestionsList, data.suggestions, "suggestion");

  // Show panel
  resultsPanel.hidden = false;
  resultsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderList(ul, items, type) {
  ul.innerHTML = "";
  if (!items || items.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No items to display.";
    ul.appendChild(li);
    return;
  }
  items.forEach((text, i) => {
    const li = document.createElement("li");
    li.textContent = text;
    li.style.animationDelay = `${i * 0.07}s`;
    ul.appendChild(li);
  });
}

// ── Form Submit ─────────────────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const payload = {
    credit_score:      parseInt(document.getElementById("creditScore").value, 10),
    monthly_income:    parseFloat(document.getElementById("monthlyIncome").value),
    existing_debt:     parseFloat(document.getElementById("existingDebt").value),
    loan_amount:       parseFloat(document.getElementById("loanAmount").value),
    employment_status: document.querySelector('input[name="employment"]:checked').value,
  };

  submitBtn.disabled = true;
  resultsPanel.hidden = true;
  showLoading();

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Server error: ${res.status}`);
    }

    const data = await res.json();
    hideLoading();
    
    // Save locally
    saveToHistory(payload, data);

    setTimeout(() => renderResults(data), 350);

  } catch (err) {
    hideLoading();
    alert(`⚠️ Could not connect to the underwriting engine.\n\nMake sure the backend is running:\n  cd backend\n  uvicorn main:app --reload\n\nError: ${err.message}`);
  } finally {
    submitBtn.disabled = false;
  }
});

// ── Init ─────────────────────────────────────────
// Pre-select "employed" as default for better UX
document.getElementById("emp-employed").checked = true;
loadHistory();

// ── CIBIL & Wealth Logic (Real-Time) ─────────────
const cibilForm = document.getElementById("cibilForm");
const onTimePayments = document.getElementById("onTimePayments");
const creditUtil = document.getElementById("creditUtil");
const creditAge = document.getElementById("creditAge");
const estimatedCibilTxt = document.getElementById("estimatedCibil");
const cibilScoreBar = document.getElementById("cibilScoreBar");
const cibilPythonInsights = document.getElementById("cibilPythonInsights");

function updateCibilPreview() {
  let score = 300;
  const onTime = parseFloat(onTimePayments.value) || 0;
  const currUtil = parseFloat(creditUtil.value) || 0;
  const age = parseFloat(creditAge.value) || 0;

  if (onTime > 0 || currUtil > 0 || age > 0) {
    // Basic CIBIL Estimation algorithm
    const onTimeScore = (onTime / 100) * 350; // Max 350
    const utilScore = Math.max(0, 200 - (currUtil * 2)); // Best under 30%, max 200
    const ageScore = Math.min(150, age * 15); // Max 150 at 10 yrs
    score = Math.floor(300 + onTimeScore + utilScore + ageScore);
    score = Math.min(900, Math.max(300, score));
  }

  estimatedCibilTxt.textContent = score;
  const pct = ((score - 300) / 600) * 100;
  cibilScoreBar.style.setProperty("--pct", `${pct}%`);
  
  if (score >= 750) cibilScoreBar.style.background = "var(--clr-approved)";
  else if (score >= 650) cibilScoreBar.style.background = "var(--clr-review)";
  else cibilScoreBar.style.background = "var(--clr-rejected)";
}

[onTimePayments, creditUtil, creditAge].forEach(input => {
  if (input) input.addEventListener("input", updateCibilPreview);
});

if (cibilForm) {
  cibilForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const income = document.getElementById("cibilIncome").value;
    const payload = {
      income: parseFloat(income),
      onTime: parseFloat(onTimePayments.value),
      util: parseFloat(creditUtil.value),
      age: parseFloat(creditAge.value),
      score: parseInt(estimatedCibilTxt.textContent, 10)
    };

    try {
      cibilPythonInsights.innerHTML = `<li class="text-muted">Fetching analysis from backend...</li>`;
      // We will create this backend API
      const res = await fetch("http://127.0.0.1:8000/cibil-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        renderList(cibilPythonInsights, data.insights, "insight");
      } else {
        cibilPythonInsights.innerHTML = `<li class="text-muted">Analysis failed. Is backend running?</li>`;
      }
    } catch(err) {
      cibilPythonInsights.innerHTML = `<li class="text-muted">Error: backend unavailable.</li>`;
    }
  });
}

// 50/30/20 Wealth Logic
const wealthIncome = document.getElementById("wealthIncome");
const bNeeds = document.getElementById("bNeeds");
const bWants = document.getElementById("bWants");
const bInvest = document.getElementById("bInvest");
const tradingGrid = document.getElementById("tradingGrid");

if (wealthIncome) {
  wealthIncome.addEventListener("input", () => {
    const val = parseFloat(wealthIncome.value);
    if (!val || val <= 0) {
      bNeeds.textContent = formatMoney(0); bWants.textContent = formatMoney(0); bInvest.textContent = formatMoney(0);
      return;
    }
    bNeeds.textContent = formatMoney(val * 0.5);
    bWants.textContent = formatMoney(val * 0.3);
    bInvest.textContent = formatMoney(val * 0.2);
  });
}

// Fetch Trading Tips
async function loadTradingTips() {
  if (!tradingGrid) return;
  try {
    const res = await fetch("http://127.0.0.1:8000/wealth-tips");
    if (res.ok) {
      const data = await res.json();
      tradingGrid.innerHTML = "";
      data.tips.forEach(t => {
        const d = document.createElement("div");
        d.className = "afford-item";
        d.innerHTML = `<span class="afford-label">Tip</span><span class="afford-value" style="font-size: 0.9rem;">${t}</span>`;
        tradingGrid.appendChild(d);
      });
    }
  } catch(e) {
    tradingGrid.innerHTML = `<div class="afford-item"><span class="afford-label">Notice</span><span class="afford-value" style="font-size: 0.9rem;">Backend offline. Cannot load live tips.</span></div>`;
  }
}
loadTradingTips();

// ── Chatbot Logic ─────────────────────────────────
if (chatToggle && chatWindow && chatClose && chatForm) {
  chatToggle.addEventListener("click", () => {
    chatWindow.classList.toggle("hidden");
    if (!chatWindow.classList.contains("hidden")) {
      chatInput.focus();
    }
  });

  chatClose.addEventListener("click", () => {
    chatWindow.classList.add("hidden");
  });

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    
    // Add user message
    const uMsg = document.createElement("div");
    uMsg.className = "chat-msg user";
    uMsg.textContent = text;
    chatMessages.appendChild(uMsg);
    
    chatInput.value = "";
    scrollToBottom();
    
    // Fake typing reply
    setTimeout(() => {
      const bMsg = document.createElement("div");
      bMsg.className = "chat-msg bot";
      bMsg.textContent = getBotReply(text.toLowerCase());
      chatMessages.appendChild(bMsg);
      scrollToBottom();
    }, 600 + Math.random() * 400);
  });

  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function getBotReply(msg) {
    if (msg.includes("score") || msg.includes("credit")) {
      return "Your credit score heavily influences your estimated APR. A score above 740 usually unlocks the best rates!";
    } else if (msg.includes("cibil")) {
      return "CIBIL scores range from 300 to 900. To improve it, keep your credit utilization below 30% and never miss an EMI payment.";
    } else if (msg.includes("sip") || msg.includes("mutual fund") || msg.includes("invest")) {
      return "A Systematic Investment Plan (SIP) helps you average out market volatility long-term. Under the 50/30/20 rule, part of your 20% should go into broad mutual funds!";
    } else if (msg.includes("trading") || msg.includes("stock")) {
      return "Intraday trading carries high risk. Start with paper trading or index funds to understand market momentum before committing large capital.";
    } else if (msg.includes("rate") || msg.includes("apr") || msg.includes("interest")) {
      return "Interest rates are determined dynamically based on your credit profile, debt-to-income ratio, and requested loan amount.";
    } else if (msg.includes("improve") || msg.includes("tips") || msg.includes("help") || msg.includes("action")) {
      return "To improve your chances, try lowering your existing debt to improve your Debt-to-Income (DTI) ratio, a major factor in our underwriting decisions.";
    } else if (msg.includes("hi") || msg.includes("hello") || msg.includes("hey")) {
      return "Hello there! Provide some context, what can I assist you with today?";
    } else if (msg.includes("thank")) {
      return "You're welcome! Let me know if you have any other questions.";
    }
    return "I'm the LoanIQ Demo Assistant! Try asking me about credit scores, interest rates, or how to improve your chances of getting approved.";
  }
}
