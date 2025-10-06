const express = require("express");
const router = express.Router();
const AuthMiddleware = require("../middlewares/auth");

router.use(AuthMiddleware());

router.get("/profile", (req, res) => {
  res.json({
    success: true,
    message: "Profile accessed",
    user: req.user,
  });
});

router.get("/dashboard", (req, res) => {
  res.json({
    success: true,
    message: "Dashboard accessed",
    user: req.user,
  });
});

module.exports = router;
