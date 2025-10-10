const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const AuthMiddleware = require("../middlewares/auth");
const biometricCollector = require("../middlewares/biometricCollector");
const mlAnalyzer = require("../middlewares/mlAnalyzer");


router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);

router.use(AuthMiddleware());

router.post("/logout", authController.logout);
router.get("/me", authController.getCurrentUser);

module.exports = router;
