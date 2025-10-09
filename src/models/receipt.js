const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
    },
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
    description: String,
    paidDate: {
      type: Date,
      required: true,
    },
    paymentMethod: String,
    transactionReference: String,
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    lastDownloaded: Date,
  },
  {
    timestamps: true,
  }
);

receiptSchema.index({ studentId: 1 });

const Receipt = mongoose.model("Receipt", receiptSchema);
module.exports = Receipt;