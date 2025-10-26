const express = require("express");
const router = express.Router();
const { createPayout, getAllPayouts } = require("../controllers/payout");
const Auth = require("../middlewares/auth");

router.use(Auth(["admin", "staff"]));

router.post("/", createPayout);
router.get("/", getAllPayouts);

module.exports = router;
