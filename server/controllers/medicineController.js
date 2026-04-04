const Medicine = require("../models/Medicine");
const StockTransaction = require("../models/StockTransaction");
const Alert = require("../models/Alert");
const { checkAndCreateAlerts } = require("../utils/alertEngine");

// @desc    Get all medicines with search, filter, pagination
// @route   GET /api/medicines
// @access  Private
const getMedicines = async (req, res, next) => {
  try {
    const {
      search,
      category,
      stockStatus,
      expiryStatus,
      page = 1,
      limit = 20,
      sortBy = "name",
      order = "asc",
    } = req.query;

    const query = { isActive: true };

    // Full-text search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { genericName: { $regex: search, $options: "i" } },
        { batchNumber: { $regex: search, $options: "i" } },
        { manufacturerName: { $regex: search, $options: "i" } },
      ];
    }

    // Category filter
    if (category) query.category = category;

    // Expiry date filter
    const now = new Date();
    if (expiryStatus === "expired") {
      query.expiryDate = { $lt: now };
    } else if (expiryStatus === "critical") {
      query.expiryDate = {
        $gte: now,
        $lt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      };
    } else if (expiryStatus === "warning") {
      query.expiryDate = {
        $gte: now,
        $lt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      };
    }

    const sortOrder = order === "desc" ? -1 : 1;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [medicines, total] = await Promise.all([
      Medicine.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("addedBy", "name email"),
      Medicine.countDocuments(query),
    ]);

    // Apply stock status filter (virtual field — must filter after fetch)
    let filtered = medicines;
    if (stockStatus) {
      filtered = medicines.filter((m) => m.stockStatus === stockStatus);
    }

    res.status(200).json({
      success: true,
      count: filtered.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      medicines: filtered,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single medicine by ID
// @route   GET /api/medicines/:id
// @access  Private
const getMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findById(req.params.id).populate(
      "addedBy",
      "name email"
    );

    if (!medicine || !medicine.isActive) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found.",
      });
    }

    // Fetch last 10 transactions for this medicine
    const recentTransactions = await StockTransaction.find({
      medicine: req.params.id,
    })
      .sort({ transactionDate: -1 })
      .limit(10)
      .populate("performedBy", "name");

    res.status(200).json({
      success: true,
      medicine,
      recentTransactions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add new medicine
// @route   POST /api/medicines
// @access  Private
const addMedicine = async (req, res, next) => {
  try {
    req.body.addedBy = req.user.id;

    const medicine = await Medicine.create(req.body);

    // Check if any alerts need to be raised immediately
    await checkAndCreateAlerts(medicine);

    // Log initial stock transaction
    if (medicine.quantity > 0) {
      await StockTransaction.create({
        medicine: medicine._id,
        medicineName: medicine.name,
        transactionType: "received",
        quantity: medicine.quantity,
        quantityBefore: 0,
        quantityAfter: medicine.quantity,
        reason: "Initial stock entry",
        performedBy: req.user.id,
      });
    }

    res.status(201).json({
      success: true,
      message: "Medicine added successfully.",
      medicine,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update medicine details
// @route   PUT /api/medicines/:id
// @access  Private
const updateMedicine = async (req, res, next) => {
  try {
    // Don't allow quantity update through this route (use updateStock)
    delete req.body.quantity;

    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Medicine updated successfully.",
      medicine,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update medicine stock (issue / receive / adjust / dispose)
// @route   PATCH /api/medicines/:id/stock
// @access  Private
const updateStock = async (req, res, next) => {
  try {
    const { transactionType, quantity, reason, referenceNumber, notes } = req.body;

    if (!transactionType || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "transactionType and quantity are required.",
      });
    }

    const medicine = await Medicine.findById(req.params.id);

    if (!medicine || !medicine.isActive) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found.",
      });
    }

    const quantityBefore = medicine.quantity;
    let quantityAfter;

    switch (transactionType) {
      case "received":
      case "returned":
        quantityAfter = quantityBefore + Math.abs(quantity);
        break;
      case "issued":
      case "disposed":
        quantityAfter = quantityBefore - Math.abs(quantity);
        break;
      case "adjusted":
        quantityAfter = quantity; // absolute value for manual adjustment
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid transaction type.",
        });
    }

    if (quantityAfter < 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot issue ${Math.abs(quantity)} units. Only ${quantityBefore} available.`,
      });
    }

    // Update medicine quantity
    medicine.quantity = quantityAfter;
    await medicine.save();

    // Log transaction
    const transaction = await StockTransaction.create({
      medicine: medicine._id,
      medicineName: medicine.name,
      transactionType,
      quantity: transactionType === "adjusted" ? quantity - quantityBefore : quantity,
      quantityBefore,
      quantityAfter,
      reason,
      referenceNumber,
      notes,
      performedBy: req.user.id,
    });

    // Re-check alerts after stock change
    await checkAndCreateAlerts(medicine);

    res.status(200).json({
      success: true,
      message: `Stock ${transactionType} recorded successfully.`,
      medicine,
      transaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Soft delete medicine
// @route   DELETE /api/medicines/:id
// @access  Private/Admin
const deleteMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Medicine removed from inventory.",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard summary stats
// @route   GET /api/medicines/stats/summary
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalMedicines,
      expiringIn30,
      expiringIn7,
      expiredCount,
      outOfStock,
    ] = await Promise.all([
      Medicine.countDocuments({ isActive: true }),
      Medicine.countDocuments({ isActive: true, expiryDate: { $gte: now, $lte: in30Days } }),
      Medicine.countDocuments({ isActive: true, expiryDate: { $gte: now, $lte: in7Days } }),
      Medicine.countDocuments({ isActive: true, expiryDate: { $lt: now } }),
      Medicine.countDocuments({ isActive: true, quantity: 0 }),
    ]);

    // Low stock (above 0 but below threshold) — aggregate
    const lowStockPipeline = await Medicine.aggregate([
      {
        $match: {
          isActive: true,
          quantity: { $gt: 0 },
          $expr: { $lte: ["$quantity", "$lowStockThreshold"] },
        },
      },
      { $count: "count" },
    ]);
    const lowStock = lowStockPipeline[0]?.count || 0;

    // Unread alerts count
    const unreadAlerts = await Alert.countDocuments({ isRead: false, isResolved: false });

    // Stock movement last 7 days
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const stockMovement = await StockTransaction.aggregate([
      { $match: { transactionDate: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$transactionDate" } },
            type: "$transactionType",
          },
          total: { $sum: { $abs: "$quantity" } },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalMedicines,
        expiringIn30,
        expiringIn7,
        expiredCount,
        outOfStock,
        lowStock,
        unreadAlerts,
        stockMovement,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMedicines,
  getMedicine,
  addMedicine,
  updateMedicine,
  updateStock,
  deleteMedicine,
  getDashboardStats,
};
