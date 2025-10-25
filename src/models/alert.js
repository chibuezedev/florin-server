const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["behavioral", "access", "transaction", "login"],
      required: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    anomalyScore: {
      type: Number,
      required: true,
    },
    prediction: {
      type: String,
    },
    confidence: {
      type: Number,
    },
    featureImportance: {
      type: Object,
    },
    explanation: {
      type: String,
    },
    details: {
      typingRhythm: Number,
      transactionFrequency: Number,
      failedLogins: Number,
      unusualTime: Boolean,
      locationAnomaly: Boolean,
      ipAddress: String,
      deviceFingerprint: String,
    },
    biometricDataId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BiometricData",
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

alertSchema.index({ userId: 1, resolved: 1, createdAt: -1 });
alertSchema.index({ severity: 1, resolved: 1 });

module.exports = mongoose.model("Alert", alertSchema);
