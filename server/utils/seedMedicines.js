/**
 * TrackMed — Seed Script
 * Imports the A-Z Medicine Dataset from Kaggle into MongoDB
 *
 * Usage:
 *   1. Place your downloaded CSV as: server/data/medicines.csv
 *   2. Run: npm run seed
 */

require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Medicine = require("../models/Medicine");
const User = require("../models/User");
const connectDB = require("../config/db");

// Map Kaggle type → our category enum
const typeToCategory = (type = "") => {
  const t = type.toLowerCase();
  if (t.includes("tablet")) return "Tablet";
  if (t.includes("capsule")) return "Capsule";
  if (t.includes("syrup") || t.includes("liquid") || t.includes("suspension")) return "Syrup";
  if (t.includes("injection") || t.includes("infusion")) return "Injection";
  if (t.includes("cream") || t.includes("gel")) return "Cream";
  if (t.includes("ointment")) return "Ointment";
  if (t.includes("drop") || t.includes("eye") || t.includes("ear")) return "Drops";
  if (t.includes("inhaler") || t.includes("spray")) return "Inhaler";
  if (t.includes("powder") || t.includes("sachet")) return "Powder";
  return "Other";
};

// Generate a random future expiry date (1–3 years from now)
const randomFutureExpiry = () => {
  const months = Math.floor(Math.random() * 24) + 12; // 12–36 months
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d;
};

// Generate random batch number
const randomBatch = (prefix = "B") => {
  return prefix + Math.floor(Math.random() * 90000 + 10000);
};

const seed = async () => {
  await connectDB();

  try {
    // Create default admin user if not exists
    const adminExists = await User.findOne({ email: "admin@trackmed.com" });
    let adminUser;

    if (!adminExists) {
      adminUser = await User.create({
        name: "Admin User",
        email: "admin@trackmed.com",
        password: "Admin@123",
        role: "admin",
        department: "Administration",
      });
      console.log("✅ Admin user created: admin@trackmed.com / Admin@123");
    } else {
      adminUser = adminExists;
      console.log("ℹ️  Admin user already exists.");
    }

    // Create a pharmacist user
    const pharmacistExists = await User.findOne({ email: "pharmacist@trackmed.com" });
    if (!pharmacistExists) {
      await User.create({
        name: "Arjun Patel",
        email: "pharmacist@trackmed.com",
        password: "Pharma@123",
        role: "pharmacist",
        department: "Pharmacy",
      });
      console.log("✅ Pharmacist created: pharmacist@trackmed.com / Pharma@123");
    }

    // Check if CSV exists
    const csvPath = path.join(__dirname, "../data/medicines.csv");
    if (!fs.existsSync(csvPath)) {
      console.log("⚠️  CSV not found at server/data/medicines.csv");
      console.log("   Seeding with sample medicines instead...");
      await seedSampleMedicines(adminUser._id);
      return;
    }

    // Parse CSV
    const csvData = fs.readFileSync(csvPath, "utf-8");
    const lines = csvData.split("\n");
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));

    console.log(`📄 Found ${lines.length - 1} medicines in CSV...`);

    const medicines = [];
    const seen = new Set();

    for (let i = 1; i < Math.min(lines.length, 501); i++) {
      // Seed first 500
      const line = lines[i];
      if (!line.trim()) continue;

      // Handle commas inside quoted fields
      const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = (values[idx] || "").replace(/"/g, "").trim();
      });

      if (!row.name || seen.has(row.name)) continue;
      seen.add(row.name);

      medicines.push({
        name: row.name,
        genericName: row.short_composition1 || "",
        batchNumber: randomBatch(),
        category: typeToCategory(row.type || row.pack_size_label || ""),
        type: row.type || "Allopathy",
        composition1: row.short_composition1 || "",
        composition2: row.short_composition2 || "",
        manufacturerName: row.manufacturer_name || "",
        price: parseFloat(row["price(₹)"]) || 0,
        packSizeLabel: row.pack_size_label || "",
        quantity: Math.floor(Math.random() * 500) + 20,
        lowStockThreshold: 50,
        expiryDate: randomFutureExpiry(),
        manufacturingDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        isDiscontinued: row.Is_discontinued === "TRUE" || row.Is_discontinued === "1",
        addedBy: adminUser._id,
      });
    }

    // Clear existing medicines and insert
    await Medicine.deleteMany({});
    const inserted = await Medicine.insertMany(medicines);
    console.log(`✅ Seeded ${inserted.length} medicines from Kaggle dataset.`);
  } catch (err) {
    console.error("❌ Seed error:", err.message);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed.");
  }
};

// Fallback: seed 20 sample medicines if no CSV
const seedSampleMedicines = async (adminId) => {
  const samples = [
    { name: "Paracetamol 500mg", genericName: "Acetaminophen", batchNumber: "P2201", category: "Tablet", quantity: 450, expiryDate: new Date("2027-12-01"), price: 12.5 },
    { name: "Amoxicillin 500mg", genericName: "Amoxicillin trihydrate", batchNumber: "MX2034", category: "Capsule", quantity: 8, expiryDate: new Date("2026-06-01"), price: 85 },
    { name: "Metformin 850mg", genericName: "Metformin hydrochloride", batchNumber: "MT5511", category: "Tablet", quantity: 120, expiryDate: new Date("2026-04-18"), price: 35 },
    { name: "Atorvastatin 10mg", genericName: "Atorvastatin calcium", batchNumber: "AT8823", category: "Tablet", quantity: 200, expiryDate: new Date("2026-04-22"), price: 145 },
    { name: "Azithromycin 250mg", genericName: "Azithromycin dihydrate", batchNumber: "AZ7731", category: "Tablet", quantity: 320, expiryDate: new Date("2028-03-01"), price: 110 },
    { name: "Cetirizine 10mg", genericName: "Cetirizine hydrochloride", batchNumber: "CT1122", category: "Tablet", quantity: 600, expiryDate: new Date("2027-09-01"), price: 28 },
    { name: "Omeprazole 20mg", genericName: "Omeprazole", batchNumber: "OM4455", category: "Capsule", quantity: 280, expiryDate: new Date("2027-06-01"), price: 55 },
    { name: "Amlodipine 5mg", genericName: "Amlodipine besylate", batchNumber: "AM9900", category: "Tablet", quantity: 400, expiryDate: new Date("2028-01-01"), price: 42 },
  ];

  await Medicine.deleteMany({});
  await Medicine.insertMany(
    samples.map((s) => ({ ...s, addedBy: adminId, manufacturingDate: new Date("2024-01-01") }))
  );
  console.log(`✅ Seeded ${samples.length} sample medicines.`);
};

seed();
