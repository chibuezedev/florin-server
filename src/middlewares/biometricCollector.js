const { v4: uuidv4 } = require("uuid");
const BiometricData = require("../models/biometrics");

const biometricCollector = async (req, res, next) => {
  const biometricPayload =
    req.body.biometrics || req.headers["x-biometric-data"];

  if (!biometricPayload || !req.user) {
    return next();
  }

  try {
    const sessionId = req.sessionId || uuidv4();

    const biometricData = new BiometricData({
      userId: req.user._id,
      email: req.user.email,
      sessionId,
      logonPattern: biometricPayload.logonPattern,
      typingSpeed: biometricPayload.typingSpeed,
      mouseDynamics: biometricPayload.mouseDynamics,
      emailContext: biometricPayload.emailContext,
      touchGesture: biometricPayload.touchGesture,
      deviceFingerprint: biometricPayload.deviceFingerprint,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // Save to database (non-blocking)
    biometricData
      .save()
      .catch((err) => console.error("Biometric save error:", err));

    // Attach to request for ML processing
    req.biometricData = biometricData;

    next();
  } catch (error) {
    console.error("Biometric collection error:", error);
    next();
  }
};

module.exports = biometricCollector;
