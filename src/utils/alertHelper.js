const Alert = require("../models/alert");

const createAlert = async (biometricData, mlAnalysis, user) => {
  try {
    const details = {};
    
    // Extract relevant details
    if (biometricData.typingSpeed?.accuracy) {
      details.typingRhythm = 100 - biometricData.typingSpeed.accuracy;
    }
    
    if (biometricData.logonPattern?.failedAttempts) {
      details.failedLogins = biometricData.logonPattern.failedAttempts;
    }
    
    // Check for unusual time (outside 6 AM - 10 PM)
    const hour = new Date().getHours();
    details.unusualTime = hour < 6 || hour > 22;
    
    if (biometricData.logonPattern?.locationConsistency < 50) {
      details.locationAnomaly = true;
    }
    
    details.ipAddress = biometricData.ipAddress;
    details.deviceFingerprint = biometricData.deviceFingerprint;

    // Determine alert type based on anomaly
    let type = "login";
    if (mlAnalysis.anomalyScore > 70) {
      type = "behavioral";
    } else if (details.locationAnomaly || details.unusualTime) {
      type = "access";
    }

    // Generate description
    const description = generateDescription(type, mlAnalysis, details);

    const alert = new Alert({
      userId: user._id,
      userName: user.name,
      email: user.email,
      type,
      severity: mlAnalysis.riskLevel,
      description,
      anomalyScore: mlAnalysis.anomalyScore,
      details,
      biometricDataId: biometricData._id,
    });

    await alert.save();
    return alert;
  } catch (error) {
    console.error("Error creating alert:", error);
    throw error;
  }
};

const generateDescription = (type, mlAnalysis, details) => {
  const score = mlAnalysis.anomalyScore;
  
  if (type === "behavioral") {
    return `Unusual behavioral pattern detected with anomaly score of ${score}. Typing rhythm and interaction patterns differ from established baseline.`;
  } else if (type === "access") {
    if (details.locationAnomaly && details.unusualTime) {
      return `Login from unusual location at atypical time. Anomaly score: ${score}.`;
    } else if (details.locationAnomaly) {
      return `Login detected from unusual location. Anomaly score: ${score}.`;
    } else if (details.unusualTime) {
      return `Login attempt at unusual time (outside typical hours). Anomaly score: ${score}.`;
    }
  } else if (type === "login") {
    if (details.failedLogins > 0) {
      return `Multiple failed login attempts detected before successful login. Anomaly score: ${score}.`;
    }
    return `Login pattern deviates from normal behavior. Anomaly score: ${score}.`;
  }
  
  return `Suspicious activity detected with anomaly score of ${score}.`;
};

module.exports = { createAlert };