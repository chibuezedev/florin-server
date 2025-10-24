const express = require("express");
const router = express.Router();
const { getDashboardStats } = require("../controllers/dashboard");
const Auth = require("../middlewares/auth");

router.use(Auth(["admin", "staff"]));

router.get("/", getDashboardStats);

module.exports = router;
