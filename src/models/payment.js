const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    description: {
      type: String,
      required: [true, "Payment description is required"],
      trim: true,
    },
    paymentType: {
      type: String,
      enum: [
        "tuition",
        "accommodation",
        "registration",
        "library",
        "laboratory",
        "medical",
        "sports",
        "examination",
        "other",
      ],
      required: true,
    },
    semester: {
      type: String,
      enum: ["First Semester", "Second Semester", "Summer"],
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
      match: [/^\d{4}\/\d{4}$/, "Academic year must be in format YYYY/YYYY"],
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "cancelled"],
      default: "pending",
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paidDate: Date,
    paymentMethod: {
      type: String,
      enum: ["card", "bank", "ussd", "cash"],
    },
    transactionReference: {
      type: String,
      unique: true,
      sparse: true,
    },
    receiptNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    metadata: {
      processorResponse: String,
      paymentGateway: String,
      channel: String,
      ipAddress: String,
    },
    notes: String,
    payout: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payout",
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.pre("save", function (next) {
  if (this.status === "paid" && !this.receiptNumber) {
    this.receiptNumber = `RCP-${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)
      .toUpperCase()}`;
  }
  next();
});

paymentSchema.index({ studentId: 1, status: 1 });
paymentSchema.index({ academicYear: 1, semester: 1 });

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
