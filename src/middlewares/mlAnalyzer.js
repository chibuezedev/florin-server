const axios = require("axios");
const BiometricData = require("../models/biometrics");

const mlAnalyzer = async (req, res, next) => {
  if (!req.biometricData) {
    return next();
  }

  try {
    const activityFlow = determineActivityFlow(req.biometricData, req.user);

    const archetype = determineArchetype(req.user, req.biometricData);

    const features = {
      userId: req.user._id.toString(),
      email: req.user.email,
      logonTimeOfDay: req.biometricData.logonPattern?.timeOfDay || 12,
      logonDayOfWeek: req.biometricData.logonPattern?.dayOfWeek || 3,
      typingSpeed: req.biometricData.typingSpeed?.wpm || 40,
      typingDwellTime: calculateMean(req.biometricData.typingSpeed?.dwellTime),
      typingFlightTime: calculateMean(
        req.biometricData.typingSpeed?.flightTime
      ),
      mouseVelocity: req.biometricData.mouseDynamics?.velocity || 500,
      mouseAcceleration: req.biometricData.mouseDynamics?.acceleration || 200,
      mouseCurvature: req.biometricData.mouseDynamics?.movementCurvature || 0.5,
      emailSendTimeConsistency: calculateConsistency(
        req.biometricData.emailContext?.typicalSendTimes
      ),
      touchPressure: req.biometricData.touchGesture?.pressure || 0.5,
      touchSwipeVelocity: req.biometricData.touchGesture?.swipeVelocity || 300,
      deviceFingerprint: req.biometricData.deviceFingerprint,
      ipAddress: req.biometricData.ipAddress,
      activityFlow: activityFlow,
      archetype: archetype,
    };

    console.log("Sending to ML model:", { activityFlow, archetype });

    const mlResponse = await axios.post(
      process.env.ML_SERVICE_URL || "http://localhost:8000/predict",
      features,
      { timeout: 5000 }
    );


    const { anomalyScore, riskLevel } = mlResponse.data;

    await BiometricData.findByIdAndUpdate(req.biometricData._id, {
      anomalyScore,
      riskLevel,
    });

    if (anomalyScore >= 50) {
      const { createAlert } = require("../utils/alertHelper");
      try {
        await createAlert(
          req.biometricData,
          { anomalyScore, riskLevel },
          req.user
        );
      } catch (alertError) {
        console.error("Alert creation error:", alertError);
      }
    }

    req.mlAnalysis = { anomalyScore, riskLevel };

    // Block high-risk requests
    if (riskLevel === "critical") {
      return res.status(403).json({
        success: false,
        message: "Request blocked due to suspicious activity",
        anomalyScore,
      });
    }

    next();
  } catch (error) {
    console.error("ML analysis error:", error.message);
    // Continue even if ML fails
    next();
  }
};

/**
 * Determine activity flow based on behavioral patterns
 * Valid values: data_access_heavy, email_focused, normal_routine,
 *               suspicious_exfiltration, system_admin
 */
function determineActivityFlow(biometricData, user) {
  const hour = biometricData.logonPattern?.timeOfDay || 12;
  const dayOfWeek = biometricData.logonPattern?.dayOfWeek || 3;
  const typingSpeed = biometricData.typingSpeed?.wpm || 40;
  const mouseVelocity = biometricData.mouseDynamics?.velocity || 500;

  // Check for suspicious patterns
  // Off-hours access (late night/early morning or weekends)
  if (hour < 6 || hour > 22 || dayOfWeek === 0 || dayOfWeek === 6) {
    return "suspicious_exfiltration";
  }

  // System admin pattern - high activity, fast typing, high mouse velocity
  if (user.role === "admin" || (typingSpeed > 60 && mouseVelocity > 600)) {
    return "system_admin";
  }

  // Data access heavy - moderate to fast typing with high mouse activity
  if (typingSpeed > 50 && mouseVelocity > 550) {
    return "data_access_heavy";
  }

  // Email focused - slower typing, moderate mouse activity
  if (typingSpeed < 45 && mouseVelocity < 500) {
    return "email_focused";
  }

  // Default to normal routine
  return "normal_routine";
}

/**
 * Determine user archetype based on characteristics
 * Valid values: casual_user, hurried_multitasker, meticulous_planner,
 *               novice_user, technical_expert
 */
function determineArchetype(user, biometricData) {
  const typingSpeed = biometricData.typingSpeed?.wpm || 40;
  const typingAccuracy = biometricData.typingSpeed?.accuracy || 95;
  const dwellTime = calculateMean(biometricData.typingSpeed?.dwellTime);
  const mouseVelocity = biometricData.mouseDynamics?.velocity || 500;

  // Technical expert - admin/dev role, fast typing, high accuracy
  if (
    (user.role === "admin" || user.role === "developer") &&
    typingSpeed > 60 &&
    typingAccuracy > 90
  ) {
    return "technical_expert";
  }

  // Hurried multitasker - very fast typing, high mouse velocity, lower accuracy
  if (typingSpeed > 70 && mouseVelocity > 600 && typingAccuracy < 90) {
    return "hurried_multitasker";
  }

  // Meticulous planner - slower typing, high accuracy, longer dwell times
  if (typingSpeed < 45 && typingAccuracy > 95 && dwellTime > 120) {
    return "meticulous_planner";
  }

  // Novice user - slow typing, lower accuracy, inconsistent patterns
  if (typingSpeed < 35 || typingAccuracy < 85) {
    return "novice_user";
  }

  // Default to casual user
  return "casual_user";
}

function calculateMean(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function calculateConsistency(times) {
  if (!times || times.length < 2) return 100;
  const variance = calculateVariance(times);
  return Math.max(0, 100 - variance);
}

function calculateVariance(arr) {
  const mean = calculateMean(arr);
  return (
    arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length
  );
}

module.exports = mlAnalyzer;
