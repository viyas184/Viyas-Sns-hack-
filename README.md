# LoanIQ: One-Stop Financial & Trading Hub ⚡

A comprehensive, responsive financial ecosystem designed to act as a singular endpoint for loan underwriting, credit score estimation, and actionable wealth generation.

<div align="center">
  <img src="https://img.shields.io/badge/Status-Hackathon_Ready-success" alt="Status" />
  <img src="https://img.shields.io/badge/Tech-JS%20%7C%20Node.js%20%7C%20Python-blue" alt="Tech" />
  <img src="https://img.shields.io/badge/Category-Finance_%26_Trading-purple" alt="Category" />
</div>

---

## 🎯 The Problem
In the modern financial landscape, **consumers use highly fragmented platforms**: one app to check their credit score, another to apply for a loan without understanding the hidden factors causing their rejection, and a completely separate app to figure out how to allocate their budgeting or trading funds.

## 💡 The Solution: LoanIQ
LoanIQ merges the entire financial lifecycle into a single, glassmorphism-styled dashboard. It acts as an unbiased underwriter, a credit-score rebuilding assistant, and a personalized wealth manager powered by intelligent heuristic models.

## 🚀 Key Features

* **Global Currency Support**: Built to scale globally from Day 1. Native `Intl.NumberFormat` integration switching seamlessly between USD ($), EUR (€), GBP (£), INR (₹), JPY (¥), and more with a single click.
* **Explainable AI (XAI) Loan Underwriting**: Predictive models that don't just output "Rejected" or "Approved", but transparently explain the driving components (DTI, Credit Age, Income Ratios) via deep insights.
* **CIBIL Score Simulator**: Real-time Javascript engine generating logical credit scores (Range: 300-900) based on on-time payment metrics and utilization ratios, updating dynamically with every keystroke.
* **50/30/20 Budgeting Engine**: Instantaneous, client-side wealth planner dividing User Income into optimal Saving, Spending, and Needs structures with real-time UI bar charts.
* **Smart Financial Chatbot**: Context-aware simulated assistant integrated natively. Features specialized NLP-mimicking triggers to provide actionable tips regarding Mutual Funds, SIPs, Intraday Trading Risks, and Credit Building.

## 💼 Business Value & Scalability
- **Customer Retention**: By giving users free CIBIL tracking and a budgeting rule-engine, they are incentivized to return to the platform daily, keeping them within the ecosystem for when they formally need a loan.
- **Explainability = Trust**: Most traditional banking models frustrate users with opaque rejection notices. LoanIQ's Explainability feature actively fosters structural trust and transparency. 
- **Lightweight Architecture**: Offloads major calculation parameters entirely to client-side JS reducing server bottlenecks completely. Can be hosted seamlessly on edge networks.

## 💻 Tech Stack
- **Frontend**: Vanilla Javascript (ES6), HTML5, CSS3 Glassmorphism UI (No heavy frontend framework bloat = blazing fast loads)
- **Backend**: Node.js, Express.js (Also includes Python FastApi model architecture for dual-environment compliance)

## 🛠️ How to Run Locally

### 1. Start the Backend API (Port 8000)
```bash
cd backend
node server.js
```
*Note: Make sure port 8000 is open. The API processes deep analytical underwriting requests and generates curated trading tips.*

### 2. Start the Frontend Application (Port 3000)
```bash
cd frontend
node serve.js
```
*Navigate to `http://localhost:3000` in your web browser to interact with the responsive dashboard.*

## 🗺️ Future Roadmap
1. Complete integration of live Plaid/Yodlee APIs for automatically fetching bank transaction data.
2. Direct brokerage linking for executing the recommended SIP/Index funds immediately through the Wealth Hub.
3. Hooking the Chatbot context to an active LLM (like Gemini 1.5 Pro) with strict financial safeguarding guardrails.
