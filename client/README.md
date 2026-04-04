# TrackMed — Frontend (React + Tailwind CSS)

## Quick Start

### 1. Install dependencies
```bash
cd client
npm install
```

### 2. Configure environment (optional)
```bash
# Only needed if backend is NOT on localhost:5000
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
```

### 3. Start the dev server
```bash
npm start
# Opens http://localhost:3000
```

> The `"proxy": "http://localhost:5000"` in package.json automatically
> forwards all `/api/*` calls to the backend during development.

---

## Pages & Features

| Route          | Page         | Key Features |
|----------------|--------------|--------------|
| `/login`       | Login        | JWT auth, demo credential quick-fill |
| `/`            | Dashboard    | Stats, stock movement chart, alerts feed, demand bar chart |
| `/inventory`   | Inventory    | Full CRUD table, search/filter/pagination, stock update modal, detail view |
| `/alerts`      | Alerts       | Filter by severity, mark read, resolve, manual scan trigger |
| `/predictions` | Predictions  | ML demand charts, stock vs need comparison, runout days |
| `/reports`     | Reports      | Expiry / Stock / Category / Transaction reports with charts |
| `/staff`       | Staff        | Admin-only staff management |
| `/settings`    | Settings     | Profile view, password change |

---

## Tech Stack

- **React 18** — UI framework
- **React Router v6** — client-side routing
- **Tailwind CSS 3** — utility-first styling
- **Chart.js + react-chartjs-2** — Line, Bar, Doughnut charts
- **Axios** — HTTP client with JWT interceptors
- **react-hot-toast** — toast notifications
- **date-fns** — date formatting
- **Google Fonts** — DM Sans (body) + Syne (display/headings)

---

## Project Structure

```
client/src/
├── api/
│   ├── axios.js          # Axios instance + JWT interceptors
│   └── services.js       # All API service functions
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx   # Navigation sidebar
│   │   └── Layout.jsx    # Main layout wrapper
│   ├── ui/
│   │   └── index.jsx     # StatCard, Modal, PageHeader, Spinner...
│   └── ProtectedRoute.jsx
├── context/
│   └── AuthContext.jsx   # Global auth state (JWT)
├── hooks/
│   └── useFetch.js       # Generic fetch hook + useDebounce
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Inventory.jsx
│   ├── Alerts.jsx
│   ├── Predictions.jsx
│   ├── Reports.jsx
│   ├── Staff.jsx
│   └── Settings.jsx
├── utils/
│   └── helpers.js        # Date, status, formatting utils
├── App.jsx               # Router setup
├── index.js              # Entry point
└── index.css             # Global styles + Tailwind layers
```

---

## Design System

- **Primary color**: `#00B5AD` (Teal — brand-500)
- **Sidebar**: `#0A2540` (Navy)
- **Font body**: DM Sans (300/400/500/600)
- **Font headings**: Syne (600/700/800)
- **Cards**: white bg, `border-gray-100`, `rounded-xl`, subtle shadow
- **Animations**: fade-up on page load with staggered delays

---

## Build for Production
```bash
npm run build
# Output → client/build/
# Serve with: npx serve -s build
```
