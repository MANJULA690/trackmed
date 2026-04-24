/**
 * TrackMed — Seed Catalog Script
 * Seeds the FULL Kaggle A-Z Medicine Dataset into a separate
 * MedicineCatalog collection used for autocomplete search.
 *
 * Usage (from server/ folder):
 *   node utils/seedCatalog.js
 *
 * Place your CSV at:  server/data/medicines.csv
 */

require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const connectDB = require("../config/db");

// Inline the model so this script is self-contained
const MedicineCatalog = require("../models/MedicineCatalog");

// ── Helpers ────────────────────────────────────────────────────
const typeToCategory = (type = "", packSize = "") => {
  const t = (type + " " + packSize).toLowerCase();
  if (t.includes("tablet")) return "Tablet";
  if (t.includes("capsule")) return "Capsule";
  if (t.includes("syrup") || t.includes("suspension") || t.includes("liquid"))
    return "Syrup";
  if (t.includes("injection") || t.includes("infusion")) return "Injection";
  if (t.includes("cream") || t.includes("gel")) return "Cream";
  if (t.includes("ointment")) return "Ointment";
  if (t.includes("drop") || t.includes("eye") || t.includes("ear"))
    return "Drops";
  if (t.includes("inhaler") || t.includes("spray")) return "Inhaler";
  if (t.includes("powder") || t.includes("sachet")) return "Powder";
  return "Other";
};

// Parse a CSV line respecting quoted fields
const parseCsvLine = (line) => {
  const result = [];
  let cur = "",
    inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      result.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  result.push(cur.trim());
  return result;
};

// ── Main ───────────────────────────────────────────────────────
const seed = async () => {
  await connectDB();

  const csvPath = path.join(__dirname, "../data/medicines.csv");

  if (!fs.existsSync(csvPath)) {
    console.error("❌  CSV not found at server/data/medicines.csv");
    console.log("   Download the Kaggle dataset and place it there.");
    await mongoose.connection.close();
    return;
  }

  console.log("📄  Reading CSV...");
  const lines = fs.readFileSync(csvPath, "utf-8").split("\n");
  const headers = parseCsvLine(lines[0]).map((h) => h.replace(/"/g, "").trim());

  console.log(`   Headers: ${headers.join(", ")}`);
  console.log(`   Rows: ${lines.length - 1}`);

  const docs = [];
  const seen = new Set();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const vals = parseCsvLine(line);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = (vals[idx] || "").replace(/"/g, "").trim();
    });

    const name = row["brand_name"] || "";
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());

    docs.push({
      name,
      genericName: row["primary_ingredient"] || "",
      composition1: row["primary_ingredient"] || "",
      composition2: row["active_ingredients"] || "",
      manufacturerName: row["manufacturer"] || "",
      type: row["dosage_form"] || "",
      packSizeLabel: `${row["pack_size"] || ""} ${row["pack_unit"] || ""}`,
      price: parseFloat(row["price_inr"] || "0") || 0,
      isDiscontinued: row["is_discontinued"] === "1",
      category: typeToCategory(
        row["dosage_form"] || "",
        row["pack_size"] || "",
      ),
    });
  }

  console.log(
    `\n🔄  Seeding ${docs.length} unique medicines into MedicineCatalog...`,
  );

  // Clear existing catalog and re-insert
  await MedicineCatalog.deleteMany({});

  // Insert in batches of 500 for speed
  const BATCH = 500;
  for (let i = 0; i < docs.length; i += BATCH) {
    await MedicineCatalog.insertMany(docs.slice(i, i + BATCH), {
      ordered: false,
    });
    process.stdout.write(
      `   Inserted ${Math.min(i + BATCH, docs.length)} / ${docs.length}\r`,
    );
  }

  console.log(`\n✅  Catalog seeded: ${docs.length} medicines`);
  await mongoose.connection.close();
  console.log("🔌  Disconnected.");
};

seed().catch((err) => {
  console.error("❌  Seed error:", err.message);
  process.exit(1);
});
