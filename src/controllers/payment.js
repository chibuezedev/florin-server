const Payment = require("../models/payment");
const Transaction = require("../models/transaction");
const StudentProfile = require("../models/studentProfile");
const Receipt = require("../models/receipt");


exports.getStudentPayments = async (req, res) => {
  try {
    const { status, semester, academicYear } = req.query;
    const query = { studentId: req.user.userId };

    if (status) query.status = status;
    if (semester) query.semester = semester;
    if (academicYear) query.academicYear = academicYear;

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .populate("studentId", "name email studentId");

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching payments",
      error: error.message,
    });
  }
};

exports.getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate(
      "studentId",
      "name email studentId department level"
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }
    
    if (
      req.user.role === "student" &&
      payment.studentId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this payment",
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching payment",
      error: error.message,
    });
  }
};

exports.initiatePayment = async (req, res) => {
  try {
    const { paymentId, paymentMethod, channel } = req.body;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Payment already completed",
      });
    }

    const transaction = await Transaction.create({
      paymentId: payment._id,
      studentId: req.user._id,
      amount: payment.amount,
      paymentMethod,
      reference: `TXN-${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)
        .toUpperCase()}`,
      channel,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // In production, integrate with payment gateway here
    // For now, we'll simulate a successful payment

    res.status(200).json({
      success: true,
      message: "Payment initiated successfully",
      data: {
        transaction,
        paymentUrl: `/api/payments/verify/${transaction.reference}`,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error initiating payment",
      error: error.message,
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    const transaction = await Transaction.findOne({ reference }).populate(
      "paymentId"
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    transaction.status = "completed";
    transaction.processedAt = new Date();
    await transaction.save();


    const payment = await Payment.findById(transaction.paymentId);
    payment.status = "paid";
    payment.paidDate = new Date();
    payment.paymentMethod = transaction.paymentMethod;
    payment.transactionReference = transaction.reference;
    await payment.save();

    const profile = await StudentProfile.findOne({ userId: req.user._id });
    if (profile) {
      profile.totalPaid += payment.amount;
      profile.totalPending -= payment.amount;
      await profile.save();
    }

    const receipt = await Receipt.create({
      receiptNumber: payment.receiptNumber,
      paymentId: payment._id,
      studentId: req.user._id,
      amount: payment.amount,
      description: payment.description,
      paidDate: payment.paidDate,
      paymentMethod: payment.paymentMethod,
      transactionReference: payment.transactionReference,
    });

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: {
        payment,
        transaction,
        receipt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error verifying payment",
      error: error.message,
    });
  }
};

exports.getPaymentSummary = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({
      userId: req.user.userId,
    }).populate("userId", "name email studentId");

    const payments = await Payment.find({ studentId: req.user.userId });

    const summary = {
      profile,
      totalPaid: profile?.totalPaid || 0,
      totalPending: profile?.totalPending || 0,
      pendingPayments: payments.filter((p) => p.status === "pending"),
      completedPayments: payments.filter((p) => p.status === "paid"),
      recentTransactions: await Transaction.find({ studentId: req.user.userId })
        .sort({ createdAt: -1 })
        .limit(5),
    };

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching payment summary",
      error: error.message,
    });
  }
};

exports.getReceipt = async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate("paymentId")
      .populate("studentId", "name email studentId department level");

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    receipt.downloadCount += 1;
    receipt.lastDownloaded = new Date();
    await receipt.save();

    res.status(200).json({
      success: true,
      data: receipt,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching receipt",
      error: error.message,
    });
  }
};

exports.createPayment = async (req, res) => {
  try {
    const {
      studentId,
      amount,
      description,
      paymentType,
      semester,
      academicYear,
      dueDate,
    } = req.body;

    const payment = await Payment.create({
      studentId,
      amount,
      description,
      paymentType,
      semester,
      academicYear,
      dueDate,
      status: "pending",
    });

    // Update student profile
    const profile = await StudentProfile.findOne({ userId: studentId });
    if (profile) {
      profile.totalPending += amount;
      await profile.save();
    }

    res.status(201).json({
      success: true,
      message: "Payment created successfully",
      data: payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating payment",
      error: error.message,
    });
  }
};

exports.getAllPayments = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;

    const payments = await Payment.find(query)
      .populate("studentId", "name email studentId department")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching payments",
      error: error.message,
    });
  }
};

