const express = require("express");
const router = express.Router();
const BiometricData = require("../models/biometrics");
const auth = require("../middlewares/auth");

router.use(auth());

router.get("/history", async (req, res) => {
  try {
    const data = await BiometricData.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// anomaly timeline
router.get("/anomalies", async (req, res) => {
  try {
    const data = await BiometricData.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d %H:00", date: "$createdAt" },
          },
          avgScore: { $avg: "$anomalyScore" },
          maxScore: { $max: "$anomalyScore" },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 24 },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.use(auth("admin"));

router.get("/", async (req, res) => {
  try {
    const data = await BiometricData.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/anomalies/timeline", async (req, res) => {
  try {
    const data = await BiometricData.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d %H:00", date: "$createdAt" },
          },
          avgScore: { $avg: "$anomalyScore" },
          maxScore: { $max: "$anomalyScore" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 24 },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
