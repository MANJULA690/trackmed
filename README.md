# TrackMed

Full-stack MERN hospital pharmacy management system automating medicine inventory tracking, expiry monitoring, real-time alerts, and ML-based demand prediction.

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


### Tech Stack

- **React 18** — UI framework
- **React Router v6** — client-side routing
- **Tailwind CSS 3** — utility-first styling
- **Chart.js + react-chartjs-2** — Line, Bar, Doughnut charts
- **Axios** — HTTP client with JWT interceptors
- **react-hot-toast** — toast notifications
- **date-fns** — date formatting
- **Google Fonts** — DM Sans (body) + Syne (display/headings)


## ML Prediction Model

The demand predictor (`server/ml/demandPredictor.js`) uses:

- **Weighted Moving Average** — recent days weighted more heavily
- **Linear Regression** — detects trend direction (slope)
- **Blended prediction** — 60% WMA + 40% regression for stability

**Input:** Last 90 days of `issued` stock transactions per medicine  
**Output:** Predicted units needed for next 30 days, daily average, trend direction, confidence level

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
