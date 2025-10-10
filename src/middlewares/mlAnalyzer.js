const axios = require("axios");
const BiometricData = require("../models/biometrics");

const mlAnalyzer = async (req, res, next) => {
  if (!req.biometricData) {
    return next();
  }

  try {
    // Prepare features for ML model
    const features = {
      userId: req.user._id.toString(),
      email: req.user.email,
      logonTimeOfDay: req.biometricData.logonPattern?.timeOfDay,
      logonDayOfWeek: req.biometricData.logonPattern?.dayOfWeek,
      typingSpeed: req.biometricData.typingSpeed?.wpm,
      typingDwellTime: calculateMean(req.biometricData.typingSpeed?.dwellTime),
      typingFlightTime: calculateMean(
        req.biometricData.typingSpeed?.flightTime
      ),
      mouseVelocity: req.biometricData.mouseDynamics?.velocity,
      mouseAcceleration: req.biometricData.mouseDynamics?.acceleration,
      mouseCurvature: req.biometricData.mouseDynamics?.movementCurvature,
      emailSendTimeConsistency: calculateConsistency(
        req.biometricData.emailContext?.typicalSendTimes
      ),
      touchPressure: req.biometricData.touchGesture?.pressure,
      touchSwipeVelocity: req.biometricData.touchGesture?.swipeVelocity,
      deviceFingerprint: req.biometricData.deviceFingerprint,
      ipAddress: req.biometricData.ipAddress,
    };

    // Call ML model API
    const mlResponse = await axios.post(
      process.env.ML_SERVICE_URL || "http://localhost:8000/predict",
      features,
      { timeout: 3000 }
    );

    const { anomalyScore, riskLevel } = mlResponse.data;

    // Update biometric data with ML results
    await BiometricData.findByIdAndUpdate(req.biometricData._id, {
      anomalyScore,
      riskLevel,
    });

    // Create alert for significant anomalies
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

    // Attach to request for downstream use
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
    console.error("ML analysis error:", error);
    // Continue even if ML fails
    next();
  }
};

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
