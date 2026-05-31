# TrackMed

Hospital Pharmacy Inventory Management System · MERN Stack (MongoDB + Express + React + Node.js)

---

## Table of Contents

- [Quick Start](#quick-start)
- [Default Login Credentials](#default-login-credentials)
- [Frontend](#frontend)
- [Backend API](#backend-api)
- [ML Prediction Model](#ml-prediction-model)
- [Cron Jobs](#cron-jobs)
- [Project Structure](#project-structure)

---

## Quick Start

### Backend

```bash
cd server
npm install
```

Configure environment:

```bash
cp .env.example .env
# Open .env and fill in your MongoDB Atlas URI and JWT secret
```

Seed the database:

```bash
# Option A: With Kaggle CSV — place medicines.csv in server/data/ first
npm run seed

# Option B: Without CSV — auto seeds 8 sample medicines
npm run seed
```

Start the server:

```bash
npm run dev      # development (nodemon, auto-restart)
npm start        # production
```

Server runs at: `http://localhost:5000`

---

### Frontend

```bash
cd client
npm install
```

Configure environment (optional):

```bash
# Only needed if backend is NOT on localhost:5000
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
```

Start the dev server:

```bash
npm start
# Opens http://localhost:3000
```

> The `"proxy": "http://localhost:5000"` in `package.json` automatically forwards all `/api/*` calls to the backend during development.

Build for production:

```bash
npm run build
# Output → client/build/
# Serve with: npx serve -s build
```

---

## Default Login Credentials (after seed)

| Role       | Email                   | Password   |
| ---------- | ----------------------- | ---------- |
| Admin      | admin@trackmed.com      | Admin@123  |
| Pharmacist | pharmacist@trackmed.com | Pharma@123 |

---

## Frontend

### Pages & Features

| Route          | Page        | Key Features                                                               |
| -------------- | ----------- | -------------------------------------------------------------------------- |
| `/login`       | Login       | JWT auth, demo credential quick-fill                                       |
| `/`            | Dashboard   | Stats, stock movement chart, alerts feed, demand bar chart                 |
| `/inventory`   | Inventory   | Full CRUD table, search/filter/pagination, stock update modal, detail view |
| `/alerts`      | Alerts      | Filter by severity, mark read, resolve, manual scan trigger                |
| `/predictions` | Predictions | ML demand charts, stock vs need comparison, runout days                    |
| `/reports`     | Reports     | Expiry / Stock / Category / Transaction reports with charts                |
| `/staff`       | Staff       | Admin-only staff management                                                |
| `/settings`    | Settings    | Profile view, password change                                              |

### Tech Stack

- **React 18** — UI framework
- **React Router v6** — client-side routing
- **Tailwind CSS 3** — utility-first styling
- **Chart.js + react-chartjs-2** — Line, Bar, Doughnut charts
- **Axios** — HTTP client with JWT interceptors
- **react-hot-toast** — toast notifications
- **date-fns** — date formatting
- **Google Fonts** — DM Sans (body) + Syne (display/headings)

### Design System

- **Primary color**: `#00B5AD` (Teal — brand-500)
- **Sidebar**: `#0A2540` (Navy)
- **Font body**: DM Sans (300/400/500/600)
- **Font headings**: Syne (600/700/800)
- **Cards**: white bg, `border-gray-100`, `rounded-xl`, subtle shadow
- **Animations**: fade-up on page load with staggered delays

---

## Backend API

### Authentication

All protected routes require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Auth `/api/auth`

| Method | Route              | Access  | Description          |
| ------ | ------------------ | ------- | -------------------- |
| POST   | `/register`        | Public  | Register new user    |
| POST   | `/login`           | Public  | Login, get JWT token |
| GET    | `/me`              | Private | Get current user     |
| PUT    | `/update-password` | Private | Change password      |
| GET    | `/users`           | Admin   | List all staff       |

### Medicines `/api/medicines`

| Method | Route            | Access  | Description                      |
| ------ | ---------------- | ------- | -------------------------------- |
| GET    | `/`              | Private | List all (search, filter, paged) |
| POST   | `/`              | Private | Add new medicine                 |
| GET    | `/stats/summary` | Private | Dashboard stats                  |
| GET    | `/:id`           | Private | Get single medicine + history    |
| PUT    | `/:id`           | Private | Update medicine details          |
| PATCH  | `/:id/stock`     | Private | Issue / receive / adjust stock   |
| DELETE | `/:id`           | Admin   | Soft-delete medicine             |

### Alerts `/api/alerts`

| Method | Route            | Access  | Description                 |
| ------ | ---------------- | ------- | --------------------------- |
| GET    | `/`              | Private | Get all alerts (filterable) |
| PATCH  | `/mark-all-read` | Private | Mark all alerts read        |
| POST   | `/scan`          | Private | Trigger manual alert scan   |
| PATCH  | `/:id/read`      | Private | Mark single alert read      |
| PATCH  | `/:id/resolve`   | Private | Resolve an alert            |

### Predictions `/api/predictions`

| Method | Route                  | Access  | Description                      |
| ------ | ---------------------- | ------- | -------------------------------- |
| GET    | `/`                    | Private | Top N demand predictions         |
| GET    | `/:medicineId`         | Private | Prediction for one medicine      |
| GET    | `/:medicineId/history` | Private | Transaction history (for charts) |

### Reports `/api/reports`

| Method | Route                | Access  | Description                   |
| ------ | -------------------- | ------- | ----------------------------- |
| GET    | `/expiry`            | Private | Expiry report (30/60/90 days) |
| GET    | `/stock`             | Private | Low stock + out of stock      |
| GET    | `/transactions`      | Private | Stock movement (date range)   |
| GET    | `/category-overview` | Private | Category-wise summary         |

### Stock Update — Request Body

```json
{
  "transactionType": "issued",
  "quantity": 50,
  "reason": "Patient dispensing",
  "referenceNumber": "RX-20240403",
  "notes": "Optional notes"
}
```

> `transactionType` options: `received` | `issued` | `adjusted` | `disposed` | `returned`

---

## ML Prediction Model

The demand predictor (`server/ml/demandPredictor.js`) uses:

- **Weighted Moving Average** — recent days weighted more heavily
- **Linear Regression** — detects trend direction (slope)
- **Blended prediction** — 60% WMA + 40% regression for stability

**Input:** Last 90 days of `issued` stock transactions per medicine  
**Output:** Predicted units needed for next 30 days, daily average, trend direction, confidence level

---

## Cron Jobs

| Schedule      | Job                |
| ------------- | ------------------ |
| Daily 8:00 AM | Full alert scan    |
| On startup    | Initial alert scan |

---

## Project Structure

```
trackmed/
├── client/                         # React frontend
│   └── src/
│       ├── api/
│       │   ├── axios.js            # Axios instance + JWT interceptors
│       │   └── services.js         # All API service functions
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Sidebar.jsx     # Navigation sidebar
│       │   │   └── Layout.jsx      # Main layout wrapper
│       │   ├── ui/
│       │   │   └── index.jsx       # StatCard, Modal, PageHeader, Spinner...
│       │   └── ProtectedRoute.jsx
│       ├── context/
│       │   └── AuthContext.jsx     # Global auth state (JWT)
│       ├── hooks/
│       │   └── useFetch.js         # Generic fetch hook + useDebounce
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Inventory.jsx
│       │   ├── Alerts.jsx
│       │   ├── Predictions.jsx
│       │   ├── Reports.jsx
│       │   ├── Staff.jsx
│       │   └── Settings.jsx
│       ├── utils/
│       │   └── helpers.js          # Date, status, formatting utils
│       ├── App.jsx                 # Router setup
│       ├── index.js                # Entry point
│       └── index.css               # Global styles + Tailwind layers
│
└── server/                         # Node.js + Express backend
    ├── config/
    │   └── db.js                   # MongoDB connection
    ├── controllers/
    │   ├── authController.js       # Register, login, users
    │   ├── medicineController.js   # Full CRUD + stock update
    │   ├── alertController.js      # Alert management
    │   └── predictionController.js # ML prediction endpoints
    ├── middleware/
    │   ├── auth.js                 # JWT protect + authorize
    │   └── errorHandler.js         # Global error handler
    ├── ml/
    │   └── demandPredictor.js      # WMA + Linear Regression
    ├── models/
    │   ├── User.js                 # Staff accounts
    │   ├── Medicine.js             # Inventory items
    │   ├── StockTransaction.js     # Audit trail
    │   └── Alert.js                # System alerts
    ├── routes/
    │   ├── auth.js
    │   ├── medicines.js
    │   ├── alerts.js
    │   ├── predictions.js
    │   └── reports.js
    ├── utils/
    │   ├── alertEngine.js          # Alert threshold checker
    │   └── seedMedicines.js        # Kaggle CSV importer
    ├── data/
    │   └── README.txt              # Place medicines.csv here
    ├── server.js                   # Entry point
    ├── .env.example                # Environment template
    └── package.json
```
