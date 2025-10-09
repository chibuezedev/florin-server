const mongoose = require("mongoose");

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    regNumber: {
      type: String,
      required: true,
      unique: true,
    },
    matricNumber: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    phoneNumber: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
    },
    nextOfKin: {
      name: String,
      relationship: String,
      phoneNumber: String,
      address: String,
    },
    admissionYear: String,
    expectedGraduation: String,
    cgpa: Number,
    totalPaid: {
      type: Number,
      default: 0,
    },
    totalPending: {
      type: Number,
      default: 0,
    },
    totalOwed: {
      type: Number,
      default: 0,
    },
    accountStatus: {
      type: String,
      enum: ["active", "inactive", "suspended", "graduated"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);

module.exports = StudentProfile;
