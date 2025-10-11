const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    transactionType: {
      type: String,
      enum: ["payment", "refund", "reversal"],
      default: "payment",
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["card", "bank", "ussd", "cash"],
      required: true,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
    },
    gatewayReference: String,
    gatewayResponse: {
      code: String,
      message: String,
      data: mongoose.Schema.Types.Mixed,
    },
    currency: {
      type: String,
      default: "NGN",
    },
    channel: String,
    ipAddress: String,
    userAgent: String,
    attemptCount: {
      type: Number,
      default: 1,
    },
    failureReason: String,
    processedAt: Date,
    payout: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payout",
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ studentId: 1, status: 1 });
transactionSchema.index({ createdAt: -1 });

const Transaction = mongoose.model("Transaction", transactionSchema);
module.exports = Transaction;
