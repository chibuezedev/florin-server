const axios = require("axios");

async function analyzeBiometrics(biometricData, userId, email) {
  try {
    const features = {
      userId: userId?.toString(),
      email,
      logonTimeOfDay: biometricData.logonPattern?.timeOfDay,
      logonDayOfWeek: biometricData.logonPattern?.dayOfWeek,
      typingSpeed: biometricData.typingSpeed?.wpm,
      typingDwellTime: calculateMean(biometricData.typingSpeed?.dwellTime),
      typingFlightTime: calculateMean(biometricData.typingSpeed?.flightTime),
      mouseVelocity: biometricData.mouseDynamics?.velocity,
      mouseAcceleration: biometricData.mouseDynamics?.acceleration,
      mouseCurvature: biometricData.mouseDynamics?.movementCurvature,
      emailSendTimeConsistency: calculateConsistency(
        biometricData.emailContext?.typicalSendTimes
      ),
      touchPressure: biometricData.touchGesture?.pressure,
      touchSwipeVelocity: biometricData.touchGesture?.swipeVelocity,
      deviceFingerprint: biometricData.deviceFingerprint,
      ipAddress: biometricData.ipAddress,
    };

    const mlResponse = await axios.post(
      process.env.ML_SERVICE_URL || "http://localhost:8000/predict",
      features,
      { timeout: 3000 }
    );

    return {
      anomalyScore: mlResponse.data.anomalyScore,
      riskLevel: mlResponse.data.riskLevel,
    };
  } catch (error) {
    console.error("ML analysis error:", error);
    // Return safe defaults if ML service fails
    return {
      anomalyScore: 0,
      riskLevel: "low",
    };
  }
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
  return arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
}

module.exports = { analyzeBiometrics };