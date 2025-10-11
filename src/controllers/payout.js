const { v4: uuidv4 } = require("uuid");
const Payout = require("../models/payout");
const User = require("../models/user");
const BiometricData = require("../models/biometrics");
const { analyzeBiometrics } = require("../utils/mlAnalyzer");

exports.createPayout = async (req, res) => {
  try {
    const {
      title,
      description,
      amount,
      paymentType,
      targetType,
      departments,
      faculties,
      levels,
      programs,
      semester,
      academicYear,
      dueDate,
      notes,
      biometrics,
    } = req.body;

    const payoutData = {
      title,
      description,
      amount,
      paymentType,
      targetType,
      semester,
      academicYear,
      dueDate,
      createdBy: req.user.userId,
    };

    if (targetType === "department" && departments) {
      payoutData.departments = departments;
    }
    if (targetType === "faculty" && faculties) {
      payoutData.faculties = faculties;
    }
    if (targetType === "level" && levels) {
      payoutData.levels = levels;
    }
    if (targetType === "program" && programs) {
      payoutData.programs = programs;
    }
    if (targetType === "custom") {
      payoutData.departments = departments || [];
      payoutData.faculties = faculties || [];
      payoutData.levels = levels || [];
      payoutData.programs = programs || [];
    }
    if (notes) {
      payoutData.notes = notes;
    }

    const payout = await Payout.create(payoutData);

    let mlAnalysis = null;
    if (biometrics) {
      const user = await User.findOne({ _id: req.user.userId });
      try {
        const biometricData = new BiometricData({
          userId: user._id,
          email: user.email,
          sessionId: uuidv4(),
          logonPattern: biometrics.logonPattern,
          typingSpeed: biometrics.typingSpeed,
          mouseDynamics: biometrics.mouseDynamics,
          emailContext: biometrics.emailContext,
          touchGesture: biometrics.touchGesture,
          deviceFingerprint: biometrics.deviceFingerprint,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
        });

        await biometricData.save();

        // Analyze with ML
        mlAnalysis = await analyzeBiometrics(
          biometricData,
          user._id,
          user.email
        );

        // Update with ML results
        biometricData.anomalyScore = mlAnalysis.anomalyScore;
        biometricData.riskLevel = mlAnalysis.riskLevel;
        await biometricData.save();

        // Block critical risk
        if (mlAnalysis.riskLevel === "critical") {
          return res.status(403).json({
            success: false,
            message: "Login blocked due to suspicious activity",
            mlAnalysis,
          });
        }
        // Create alert for high anomaly scores
        if (mlAnalysis.anomalyScore >= 50) {
          const { createAlert } = require("../utils/alertHelper");
          try {
            await createAlert(biometricData, mlAnalysis, user);
          } catch (alertError) {
            console.error("Alert creation error:", alertError);
          }
        }
      } catch (biometricError) {
        console.error("Biometric processing error:", biometricError);
      }
    }

    res.status(201).json({
      success: true,
      message: "Payout created successfully",
      data: payout,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating payout",
      error: error.message,
    });
  }
};

exports.getAllPayouts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      isActive,
      paymentType,
      targetType,
      semester,
      academicYear,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }
    if (paymentType) {
      filter.paymentType = paymentType;
    }
    if (targetType) {
      filter.targetType = targetType;
    }
    if (semester) {
      filter.semester = semester;
    }
    if (academicYear) {
      filter.academicYear = academicYear;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === "asc" ? 1 : -1;

    const payouts = await Payout.find(filter)
      .populate("createdBy", "name email")
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payout.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: payouts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching payouts",
      error: error.message,
    });
  }
};
