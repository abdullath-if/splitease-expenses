# SplitEase — Production-Quality Expense Splitting App (MERN Stack)

> A modern, production-grade expense-splitting web application (inspired by Splitwise) engineered with the MERN stack. SplitEase empowers groups to track shared expenses, compute net balances, and minimize settlement transactions using a greedy graph debt-simplification algorithm.

---

## 🌟 Standout Feature: The Debt Simplification Engine

In any multi-member group trip or shared apartment, a web of directed debts forms between members:
- *Aman paid for dinner, so Priya owes Aman ₹300.*
- *Priya paid for cabs, so Carlos owes Priya ₹200 and Aman owes Priya ₹100.*
- *Carlos paid for drinks, so Aman owes Carlos ₹150.*

In an $N$-person group, naive settling could require up to $\frac{N(N - 1)}{2}$ transactions ($O(N^2)$). For 5 members, that could mean up to 10 payments!

### The Algorithm: Greedy Matching of Largest Creditor with Largest Debtor

SplitEase implements this as an isolated, testable utility: [`simplifyDebts(balances)`](server/utils/debtSimplifier.js).

```
1. Compute Net Balances:
   For each user:
   Net = (Total Paid) - (Total Share Owed) + (Settled Out) - (Settled In)

2. Separate into two priority sets:
   - Debtors:  users with Net < 0 (sorted by largest absolute debt descending)
   - Creditors: users with Net > 0 (sorted by largest credit descending)

3. Greedy Pairwise Settlement:
   While Debtors and Creditors exist:
     a. D = Largest Debtor, C = Largest Creditor
     b. Amount = min(|D.debt|, C.credit)
     c. Record Minimal Transaction: "D pays C Amount"
     d. D.debt -= Amount, C.credit -= Amount
     e. If D.debt == 0, advance Debtor pointer
     f. If C.credit == 0, advance Creditor pointer

4. Result:
   Guarantees all group debts are fully resolved in at most (N - 1) transactions!
```

### Interview Walkthrough Example: 5 Debts Simplified to 2 Transactions

Consider 5 friends on a weekend trip:

| Member | Total Paid | Total Share Owed | Net Balance | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Aman** | ₹1,200 | ₹750 | **+₹450** | Creditor |
| **Priya** | ₹800 | ₹500 | **+₹300** | Creditor |
| **Carlos** | ₹0 | ₹200 | **-₹200** | Debtor |
| **Sarah** | ₹0 | ₹350 | **-₹350** | Debtor |
| **Alex** | ₹0 | ₹200 | **-₹200** | Debtor |

- **Total Creditors**: $+450 + 300 = +750$
- **Total Debtors**: $-200 - 350 - 200 = -750$

**Naive Approach**: Requires 5 distinct transactions between individuals.

**SplitEase Greedy Algorithm**:
1. Largest Debtor: **Sarah (-₹350)**. Largest Creditor: **Aman (+₹450)**.
   - Settle $\min(350, 450) =$ **₹350**.
   - Transaction 1: **Sarah pays Aman ₹350**.
   - Remaining: Sarah = 0 (resolved!), Aman = +₹100.
2. Largest Debtor: **Carlos (-₹200)**. Largest Creditor: **Priya (+₹300)**.
   - Settle $\min(200, 300) =$ **₹200**.
   - Transaction 2: **Carlos pays Priya ₹200**.
   - Remaining: Carlos = 0 (resolved!), Priya = +₹100.
3. Largest Debtor: **Alex (-₹200)**. Largest Creditors: **Aman (+₹100)** and **Priya (+₹100)**.
   - Settle $\min(200, 100) =$ **₹100** with Aman.
   - Transaction 3: **Alex pays Aman ₹100** (Aman = 0, resolved!).
   - Settle remaining **₹100** with Priya.
   - Transaction 4: **Alex pays Priya ₹100** (Priya = 0, Alex = 0, both resolved!).

All 5 debts completely cleared with mathematically optimal transactions and zero money lost!

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4 (with `@tailwindcss/vite`)
- **Icons**: Lucide React
- **Charts**: Recharts (Pie/Donut and Area Trend charts)
- **Forms**: Controlled forms with real-time math split validation
- **State & Context**: Context API (`AuthContext`, `ToastContext`)
- **HTTP Client**: Axios with automatic JWT Bearer interceptor

### Backend
- **Runtime**: Node.js & Express.js
- **Database**: MongoDB with Mongoose ODM
- **In-Memory Zero-Setup DB**: `mongodb-memory-server` with instant local binary caching (no manual MongoDB installation required!)
- **Authentication**: JWT (JSON Web Tokens) with 30-day expiry
- **Security**: bcryptjs password hashing, express-rate-limit on auth routes, CORS protection, and input sanitization

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### 1. Installation
Clone the repository and install dependencies:
```bash
# In project root
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
cd ..
```

### 2. Start the Application
Run both frontend and backend concurrently with a single command:
```bash
npm run dev
```

Or run them individually in separate terminals:
```bash
# Terminal 1: Backend (Port 5000)
npm run dev:server

# Terminal 2: Frontend (Port 5173)
npm run dev:client
```

Open your browser at **`http://localhost:5173`**.

---

## 🔑 Demo Account Credentials

SplitEase automatically seeds demo data on the first run with pre-populated groups and realistic expenses!

| Role | Email | Password |
| :--- | :--- | :--- |
| **Demo User** | `demo@splitease.com` | `password123` |
| **Priya Sharma** | `priya@example.com` | `password123` |
| **Aman Verma** | `aman@example.com` | `password123` |

> 💡 **Tip**: On the login page, you can simply click the **"Explore Demo Account (1-Click)"** button for instant one-click login!

---

## 📂 Project Architecture

```
expences/
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── components/         # Navbar, Sidebar, Modals, Charts, Tabs
│   │   │   ├── BalancesTab.jsx # Debt Simplification Visualizer & Settle Up
│   │   │   ├── ExpensesTab.jsx # Filterable Expense List & Split Badges
│   │   │   ├── MembersTab.jsx  # Member Management & Balance Status
│   │   │   ├── ExpenseModal.jsx# Equal / Exact / Percentage Split Forms
│   │   │   ├── SettleModal.jsx # One-Click Debt Settlement
│   │   │   ├── CategoryChart.jsx # Recharts Category Breakdown
│   │   │   └── SpendTrendChart.jsx # Recharts Monthly Spend Trends
│   │   ├── context/            # AuthContext, ToastContext
│   │   ├── pages/              # Dashboard, Groups, GroupDetail, Profile, Login
│   │   ├── services/           # Axios API instance with JWT interceptor
│   │   └── utils/              # Currency formatting (INR ₹), category themes
│   └── vite.config.js          # Vite config with /api reverse proxy
│
├── server/                     # Node.js + Express Backend
│   ├── config/                 # DB connection (MongoDB / in-memory fallback)
│   ├── controllers/            # auth, group, expense, settlement, dashboard
│   ├── middleware/             # JWT auth protection, error handling, rate limiting
│   ├── models/                 # User, Group, Expense, Settlement, ActivityLog
│   ├── routes/                 # RESTful API endpoints
│   ├── seeds/                  # Realistic sample data seed script
│   ├── tests/                  # Unit test suite for debt simplification
│   ├── utils/                  # debtSimplifier.js (Greedy Debt Engine)
│   └── server.js               # Express application entry point
│
└── package.json                # Root scripts (dev, test, build, seed)
```

---

## 📊 Core Features & Split Types

### 1. Equal Split ($=$)
Divides the total bill evenly across all selected participants. Any sub-cent remainder is distributed cleanly to prevent rounding drift:
$$\text{share} = \left\lfloor \frac{\text{total}}{N} \right\rfloor$$

### 2. Exact Amounts ($\text{₹}$)
Participants pay custom amounts. The form provides real-time math feedback:
$$\sum_{i=1}^N \text{shares}_i = \text{total}$$

### 3. Percentage Split ($\%$)
Users allocate percentage shares ($0-100\%$). Rupee equivalents are automatically calculated in real-time:
$$\sum_{i=1}^N \text{percentages}_i = 100\%$$

---

## 🧪 Testing

To run the automated unit test suite for the Debt Simplification Engine and split validators:
```bash
npm test
```

Test coverage includes:
- Multi-way circular debt simplification
- 5-party debt reduction to minimal transactions
- Zero balance no-op verification
- Floating-point currency precision and rounding integrity
- Split percentage & exact share validation

---

## 🛡️ Security & Performance

- **Password Security**: Passwords salted and hashed with `bcryptjs`.
- **Stateless Authentication**: JWT tokens with expiration handling and automatic logout on invalidation.
- **Rate Limiting**: Brute-force protection on all `/api/auth` endpoints via `express-rate-limit`.
- **Integrity Constraints**: Unsettled members cannot be deleted from groups to prevent orphaned debts.
- **Production Build**: Tree-shaken and minified with Vite.

---

## 🔮 Future Improvements

- Recurring bill schedules (e.g. monthly rent, subscriptions)
- Receipt OCR scanning with Gemini Multimodal Vision API
- In-app push notifications and email settlement receipts
- Multi-currency support with live forex conversion

---

## 📄 License
MIT License &copy; 2026 SplitEase Team. Built for production and technical interviews.