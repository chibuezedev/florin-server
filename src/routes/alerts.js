const express = require("express");
const router = express.Router();
const Alert = require("../models/alert");
const auth = require("../middlewares/auth");

router.use(auth("admin"));

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
    console.error("Error fetching alerts:", error);
    res.status(500).json({ success: false, message: "Failed to fetch alerts" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res
        .status(404)
        .json({ success: false, message: "Alert not found" });
    }

    res.json({ success: true, data: alert });
  } catch (error) {
    console.error("Error fetching alert:", error);
    res.status(500).json({ success: false, message: "Failed to fetch alert" });
  }
});

router.patch("/:id/resolve", async (req, res) => {
  try {
    const { notes } = req.body;

    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res
        .status(404)
        .json({ success: false, message: "Alert not found" });
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();
    alert.resolvedBy = req.user.userId;
    if (notes) alert.notes = notes;

    await alert.save();

    res.json({
      success: true,
      data: alert,
      message: "Alert resolved successfully",
    });
  } catch (error) {
    console.error("Error resolving alert:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to resolve alert" });
  }
});

router.post("/", async (req, res) => {
  try {
    const alertData = req.body;
    const alert = new Alert(alertData);
    await alert.save();

    res.status(201).json({
      success: true,
      data: alert,
      message: "Alert created successfully",
    });
  } catch (error) {
    console.error("Error creating alert:", error);
    res.status(500).json({ success: false, message: "Failed to create alert" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);

    if (!alert) {
      return res
        .status(404)
        .json({ success: false, message: "Alert not found" });
    }

    res.json({ success: true, message: "Alert deleted successfully" });
  } catch (error) {
    console.error("Error deleting alert:", error);
    res.status(500).json({ success: false, message: "Failed to delete alert" });
  }
});

module.exports = router;
