require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const cron = require("node-cron");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const { runAlertScan } = require("./utils/alertEngine");

// ── Connect to MongoDB ────────────────────────────────────────
connectDB();

const app = express();

// ── Security & Middleware ─────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting — 100 requests per 15 min per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests. Please try again later." },
});
app.use("/api/", limiter);

// ── Health check ──────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TrackMed API is running 🚀",
    version: "1.0.0",
    environment: process.env.NODE_ENV,
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

// ── Routes ────────────────────────────────────────────────────
app.use("/api/auth",        require("./routes/auth"));
app.use("/api/medicines",   require("./routes/medicines"));
app.use("/api/alerts",      require("./routes/alerts"));
app.use("/api/predictions", require("./routes/predictions"));
app.use("/api/reports",     require("./routes/reports"));

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ── Global error handler ──────────────────────────────────────
app.use(errorHandler);

// ── Cron Jobs ─────────────────────────────────────────────────
// Run alert scan every day at 8:00 AM
cron.schedule("0 8 * * *", async () => {
  console.log("⏰ Running scheduled alert scan...");
  await runAlertScan();
});

// Also run at startup after a 3-second delay
setTimeout(async () => {
  console.log("🔍 Running initial alert scan on startup...");
  await runAlertScan();
}, 3000);

// ── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 TrackMed server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🌐 URL: http://localhost:${PORT}\n`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err.message);
  server.close(() => process.exit(1));
});

module.exports = app;
