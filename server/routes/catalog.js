const express = require("express");
const router = express.Router();
const MedicineCatalog = require("../models/MedicineCatalog");
const { protect } = require("../middleware/auth");

/**
 * GET /api/catalog/search?q=ser&limit=15
 *
 * Searches the FULL Kaggle medicine catalog (MedicineCatalog collection).
 * Returns medicines whose name starts with OR contains the query string.
 * Sorted: startsWith matches appear before contains matches.
 *
 * This is completely separate from the Medicine inventory collection.
 */
router.get("/search", protect, async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    const limit = Math.min(parseInt(req.query.limit || "15"), 30);

    if (!q) return res.json({ success: true, medicines: [], total: 0 });

    // Escape regex special characters
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Fetch more than needed so we can sort startsWith first
    const results = await MedicineCatalog.find(
      { name: { $regex: escaped, $options: "i" } },
      {
        name: 1,
        genericName: 1,
        composition1: 1,
        manufacturerName: 1,
        category: 1,
        price: 1,
        packSizeLabel: 1,
        dosage: 1,
        type: 1,
      },
    )
      .limit(limit * 4)
      .lean();

    // Sort: exact prefix matches first, then contains, then alphabetical
    const lower = q.toLowerCase();
    results.sort((a, b) => {
      const aStart = a.name.toLowerCase().startsWith(lower);
      const bStart = b.name.toLowerCase().startsWith(lower);
      if (aStart && !bStart) return -1;
      if (!aStart && bStart) return 1;
      return a.name.localeCompare(b.name);
    });

    res.json({
      success: true,
      medicines: results.slice(0, limit),
      total: results.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/catalog/count
 * Returns how many medicines are in the catalog (for admin info).
 */
router.get("/count", protect, async (req, res, next) => {
  try {
    const count = await MedicineCatalog.countDocuments();
    res.json({ success: true, count });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
