const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    // ── Core identity ──────────────────────────────────────
    name: {
      type: String,
      required: [true, "Medicine name is required"],
      trim: true,
      index: true,
    },
    genericName: {
      type: String,
      trim: true,
    },
    batchNumber: {
      type: String,
      required: [true, "Batch number is required"],
      trim: true,
      uppercase: true,
    },
    barcode: {
      type: String,
      trim: true,
    },

    // ── Classification ─────────────────────────────────────
    category: {
      type: String,
      enum: [
        "Tablet",
        "Capsule",
        "Syrup",
        "Injection",
        "Cream",
        "Ointment",
        "Drops",
        "Inhaler",
        "Powder",
        "Other",
      ],
      default: "Tablet",
    },
    type: {
      type: String, // from Kaggle: allopathy, ayurvedic, etc.
      trim: true,
    },

    // ── Composition (from Kaggle dataset) ──────────────────
    composition1: {
      type: String,
      trim: true,
    },
    composition2: {
      type: String,
      trim: true,
    },

    // ── Supplier & Manufacturer ────────────────────────────
    manufacturerName: {
      type: String,
      trim: true,
    },
    supplier: {
      name: { type: String, trim: true },
      contact: { type: String, trim: true },
      email: { type: String, trim: true },
    },

    // ── Pricing ────────────────────────────────────────────
    price: {
      type: Number,
      min: [0, "Price cannot be negative"],
      default: 0,
    },
    packSizeLabel: {
      type: String, // e.g. "strip of 10 tablets"
      trim: true,
    },

    // ── Dosage & Storage ───────────────────────────────────
    dosage: {
      type: String,
      trim: true, // e.g. "500mg", "10ml"
    },
    storageConditions: {
      type: String,
      trim: true, // e.g. "Store below 25°C"
    },
    prescriptionRequired: {
      type: Boolean,
      default: false,
    },

    // ── Stock ──────────────────────────────────────────────
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },
    unit: {
      type: String,
      default: "units", // units, strips, vials, etc.
    },
    lowStockThreshold: {
      type: Number,
      default: 50, // alert when quantity falls below this
      min: 0,
    },
    location: {
      type: String,
      trim: true, // shelf/rack location in pharmacy
    },

    // ── Dates ──────────────────────────────────────────────
    manufacturingDate: {
      type: Date,
    },
    expiryDate: {
      type: Date,
      required: [true, "Expiry date is required"],
      index: true,
    },
    receivedDate: {
      type: Date,
      default: Date.now,
    },

    // ── Status flags ───────────────────────────────────────
    isDiscontinued: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // ── Metadata ───────────────────────────────────────────
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtual: days until expiry ─────────────────────────────
medicineSchema.virtual("daysToExpiry").get(function () {
  if (!this.expiryDate) return null;
  const diff = this.expiryDate - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// ── Virtual: expiry status ─────────────────────────────────
medicineSchema.virtual("expiryStatus").get(function () {
  const days = this.daysToExpiry;
  if (days === null) return "unknown";
  if (days < 0) return "expired";
  if (days <= 7) return "critical";  // within a week
  if (days <= 30) return "warning";  // within a month
  return "ok";
});

// ── Virtual: stock status ──────────────────────────────────
medicineSchema.virtual("stockStatus").get(function () {
  if (this.quantity === 0) return "out_of_stock";
  if (this.quantity <= this.lowStockThreshold) return "low";
  return "ok";
});

// ── Indexes for fast queries ───────────────────────────────
medicineSchema.index({ name: "text", genericName: "text", manufacturerName: "text" });
medicineSchema.index({ expiryDate: 1, isActive: 1 });
medicineSchema.index({ quantity: 1, lowStockThreshold: 1 });
medicineSchema.index({ batchNumber: 1, name: 1 });

module.exports = mongoose.model("Medicine", medicineSchema);
