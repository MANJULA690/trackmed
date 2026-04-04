const mongoose = require("mongoose");

const stockTransactionSchema = new mongoose.Schema(
  {
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
      index: true,
    },
    medicineName: {
      type: String, // denormalized for quick reports
      trim: true,
    },
    transactionType: {
      type: String,
      enum: ["received", "issued", "adjusted", "disposed", "returned"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      // positive = stock added, negative = stock removed
    },
    quantityBefore: {
      type: Number,
      required: true,
    },
    quantityAfter: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      // e.g. "Patient dispensing", "Expired stock disposal", "Supplier delivery"
    },
    referenceNumber: {
      type: String,
      trim: true, // PO number, prescription ID, etc.
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    transactionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for time-series queries (ML prediction uses this)
stockTransactionSchema.index({ medicine: 1, transactionDate: -1 });
stockTransactionSchema.index({ transactionDate: -1, transactionType: 1 });

module.exports = mongoose.model("StockTransaction", stockTransactionSchema);
