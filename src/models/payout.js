const mongoose = require("mongoose");

const payoutSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Payment title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Payment description is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
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
    targetType: {
      type: String,
      enum: ["all", "department", "faculty", "level", "program", "custom"],
      required: true,
      default: "all",
    },
    departments: [
      {
        type: String,
        trim: true,
      },
    ],
    faculties: [
      {
        type: String,
        trim: true,
      },
    ],
    levels: [
      {
        type: String,
        enum: ["100", "200", "300", "400", "500", "600", "700", "800"],
      },
    ],
    programs: [
      {
        type: String,
        trim: true,
      },
    ],
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
    dueDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    appliedToCount: {
      type: Number,
      default: 0,
    },
    paidCount: {
      type: Number,
      default: 0,
    },
    totalExpectedRevenue: {
      type: Number,
      default: 0,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

payoutSchema.index({ academicYear: 1, semester: 1 });
payoutSchema.index({ isActive: 1 });
payoutSchema.index({ targetType: 1 });

const payout = mongoose.model("Payout", payoutSchema);

module.exports = payout;
