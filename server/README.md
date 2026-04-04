# TrackMed — Backend API

Medicine Stock & Expiry Prediction System · Node.js + Express + MongoDB Atlas

---

## Quick Start

### 1. Install dependencies
```bash
cd server
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Open .env and fill in your MongoDB Atlas URI and JWT secret
```

### 3. Seed the database
```bash
# Option A: With Kaggle CSV — place medicines.csv in server/data/ first
npm run seed

# Option B: Without CSV — auto seeds 8 sample medicines
npm run seed
```

### 4. Start the server
```bash
npm run dev      # development (nodemon, auto-restart)
npm start        # production
```

Server runs at: `http://localhost:5000`

---

## Default Login Credentials (after seed)

| Role        | Email                        | Password    |
|-------------|------------------------------|-------------|
| Admin       | admin@trackmed.com           | Admin@123   |
| Pharmacist  | pharmacist@trackmed.com      | Pharma@123  |

---

## API Endpoints

### Auth  `/api/auth`
| Method | Route                  | Access  | Description            |
|--------|------------------------|---------|------------------------|
| POST   | `/register`            | Public  | Register new user      |
| POST   | `/login`               | Public  | Login, get JWT token   |
| GET    | `/me`                  | Private | Get current user       |
| PUT    | `/update-password`     | Private | Change password        |
| GET    | `/users`               | Admin   | List all staff         |

### Medicines  `/api/medicines`
| Method | Route                  | Access  | Description                      |
|--------|------------------------|---------|----------------------------------|
| GET    | `/`                    | Private | List all (search, filter, paged) |
| POST   | `/`                    | Private | Add new medicine                 |
| GET    | `/stats/summary`       | Private | Dashboard stats                  |
| GET    | `/:id`                 | Private | Get single medicine + history    |
| PUT    | `/:id`                 | Private | Update medicine details          |
| PATCH  | `/:id/stock`           | Private | Issue / receive / adjust stock   |
| DELETE | `/:id`                 | Admin   | Soft-delete medicine             |

### Alerts  `/api/alerts`
| Method | Route                  | Access  | Description                |
|--------|------------------------|---------|----------------------------|
| GET    | `/`                    | Private | Get all alerts (filterable)|
| PATCH  | `/mark-all-read`       | Private | Mark all alerts read       |
| POST   | `/scan`                | Private | Trigger manual alert scan  |
| PATCH  | `/:id/read`            | Private | Mark single alert read     |
| PATCH  | `/:id/resolve`         | Private | Resolve an alert           |

### Predictions  `/api/predictions`
| Method | Route                  | Access  | Description                      |
|--------|------------------------|---------|----------------------------------|
| GET    | `/`                    | Private | Top N demand predictions         |
| GET    | `/:medicineId`         | Private | Prediction for one medicine      |
| GET    | `/:medicineId/history` | Private | Transaction history (for charts) |

### Reports  `/api/reports`
| Method | Route                  | Access  | Description                   |
|--------|------------------------|---------|-------------------------------|
| GET    | `/expiry`              | Private | Expiry report (30/60/90 days) |
| GET    | `/stock`               | Private | Low stock + out of stock      |
| GET    | `/transactions`        | Private | Stock movement (date range)   |
| GET    | `/category-overview`   | Private | Category-wise summary         |

---

## Authentication

All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Stock Update — Request Body
```json
{
  "transactionType": "issued",     // received | issued | adjusted | disposed | returned
  "quantity": 50,
  "reason": "Patient dispensing",
  "referenceNumber": "RX-20240403",
  "notes": "Optional notes"
}
```

---

## ML Prediction Model

The demand predictor (`ml/demandPredictor.js`) uses:
- **Weighted Moving Average** — recent days weighted more heavily
- **Linear Regression** — detects trend direction (slope)
- **Blended prediction** — 60% WMA + 40% regression for stability

Input: Last 90 days of `issued` stock transactions per medicine  
Output: Predicted units needed for next 30 days, daily average, trend direction, confidence level

---

## Cron Jobs

| Schedule     | Job                  |
|--------------|----------------------|
| Daily 8:00AM | Full alert scan      |
| On startup   | Initial alert scan   |

---

## Project Structure

```
server/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   ├── authController.js      # Register, login, users
│   ├── medicineController.js  # Full CRUD + stock update
│   ├── alertController.js     # Alert management
│   └── predictionController.js# ML prediction endpoints
├── middleware/
│   ├── auth.js                # JWT protect + authorize
│   └── errorHandler.js        # Global error handler
├── ml/
│   └── demandPredictor.js     # WMA + Linear Regression
├── models/
│   ├── User.js                # Staff accounts
│   ├── Medicine.js            # Inventory items
│   ├── StockTransaction.js    # Audit trail
│   └── Alert.js               # System alerts
├── routes/
│   ├── auth.js
│   ├── medicines.js
│   ├── alerts.js
│   ├── predictions.js
│   └── reports.js
├── utils/
│   ├── alertEngine.js         # Alert threshold checker
│   └── seedMedicines.js       # Kaggle CSV importer
├── data/
│   └── README.txt             # Place medicines.csv here
├── server.js                  # Entry point
├── .env.example               # Environment template
└── package.json
```
