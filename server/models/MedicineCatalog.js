const mongoose = require("mongoose");

/**
 * MedicineCatalog — stores the FULL Kaggle A-Z Medicine Dataset.
 * Separate from the Medicine model (which is your inventory).
 * This is a read-only reference catalog used for autocomplete search.
 */
const medicineCatalogSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    genericName: { type: String, trim: true, default: "" },
    manufacturerName: { type: String, trim: true, default: "" },
    type: { type: String, trim: true, default: "" },
    packSizeLabel: { type: String, trim: true, default: "" },
    composition1: { type: String, trim: true, default: "" },
    composition2: { type: String, trim: true, default: "" },
    price: { type: Number, default: 0 },
    isDiscontinued: { type: Boolean, default: false },
    category: { type: String, default: "Other" },
  },
  { timestamps: false },
);

// Text index for fast search
medicineCatalogSchema.index({ name: "text", genericName: "text" });

// Regular index for prefix/regex search (most efficient for startsWith)
// medicineCatalogSchema.index({ name: 1 });

module.exports = mongoose.model(
  "MedicineCatalog",
  medicineCatalogSchema,
  "medicinecatalogs",
);
