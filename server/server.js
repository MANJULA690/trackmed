require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const cron = require("node-cron");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const { runAlertScan } = require("./utils/alertEngine");

connectDB();

const app = express();

// ── FIX 1: Trust proxy — stops the X-Forwarded-For warning ───
app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── FIX 1: Relaxed rate limit — 500 req / 15 min (was 100) ───
// Local dev generates many requests from React hot-reload + polling
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 150 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please wait a moment.",
  },
  skip: (req) => {
    // Never rate-limit health checks
    return req.path === "/" || req.path === "/api/health";
  },
});
app.use("/api/", limiter);

// ── Health check ───────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TrackMed API is running 🚀",
    version: "1.0.0",
  });
});
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()) + "s",
  });
});

// ── Routes ─────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));
app.use("/api/medicines", require("./routes/medicines"));
app.use("/api/alerts", require("./routes/alerts"));
app.use("/api/predictions", require("./routes/predictions"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/catalog", require("./routes/catalog"));

// ── 404 ────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use(errorHandler);

// ── Cron: daily alert scan at 8 AM ────────────────────────────
cron.schedule("0 8 * * *", async () => {
  console.log("⏰ Running scheduled alert scan...");
  await runAlertScan();
});

// Startup scan (3s delay)
setTimeout(async () => {
  console.log("🔍 Running initial alert scan on startup...");
  await runAlertScan();
}, 3000);

// ── Start ──────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 TrackMed server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🌐 URL: http://localhost:${PORT}\n`);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err.message);
  server.close(() => process.exit(1));
});

module.exports = app;
