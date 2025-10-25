const mongoose = require("mongoose");

const biometricDataSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    email: {
      type: String,
      required: false,
    },
    sessionId: {
      type: String,
      required: false,
      index: true,
    },
    logonPattern: {
      timeOfDay: Number,
      dayOfWeek: Number,
      loginDuration: Number,
      failedAttempts: Number,
      locationConsistency: Number,
    },
    typingSpeed: {
      wpm: Number,
      dwellTime: [Number],
      flightTime: [Number],
      accuracy: Number,
    },
    mouseDynamics: {
      velocity: Number,
      acceleration: Number,
      clickPattern: [{ x: Number, y: Number, timestamp: Number }],
      movementCurvature: Number,
      idleTime: Number,
    },
    emailContext: {
      typicalSendTimes: [Number],
      recipientPatterns: [String],
      subjectComplexity: Number,
      emailLength: Number,
    },
    touchGesture: {
      pressure: Number,
      swipeVelocity: Number,
      tapDuration: Number,
      fingerArea: Number,
    },
    deviceFingerprint: String,
    ipAddress: String,
    userAgent: String,
    anomalyScore: {
      type: Number,
      default: 0,
    },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
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
  },
  {
    timestamps: true,
  }
);

biometricDataSchema.index({ userId: 1, createdAt: -1 });
biometricDataSchema.index({ anomalyScore: -1 });

module.exports = mongoose.model("BiometricData", biometricDataSchema);
