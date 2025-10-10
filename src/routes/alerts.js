const express = require("express");
const router = express.Router();
const Alert = require("../models/alert");
const Auth = require("../middlewares/auth");

router.use(Auth("admin", "security"));

router.get("/", async (req, res) => {
  try {
    const { filter = "active", userId } = req.query;

    const query = {};
    if (filter === "active") query.resolved = false;
    if (filter === "resolved") query.resolved = true;
    if (userId) query.userId = userId;

    const alerts = await Alert.find(query).sort({ createdAt: -1 }).limit(50);

    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch alerts" });
  }
});

router.patch("/:id/resolve", async (req, res) => {
  try {
    const { notes } = req.body;

    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: req.user._id,
        notes,
      },
      { new: true }
    );

    res.json({ success: true, data: alert });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to resolve alert" });
  }
});

module.exports = router;
