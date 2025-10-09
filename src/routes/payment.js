const express = require("express");
const router = express.Router();
const {
  getStudentPayments,
  getPayment,
  initiatePayment,
  verifyPayment,
  getPaymentSummary,
  getReceipt,
  createPayment,
  getAllPayments,
} = require("../controllers/payment");
const AuthMiddleware = require("../middlewares/auth");

router.use(AuthMiddleware());

router.get("/my-payments", getStudentPayments);
router.get("/summary", getPaymentSummary);
router.get("/:id", getPayment);
router.post("/initiate", initiatePayment);
router.get("/verify/:reference", verifyPayment);
router.get("/receipt/:id", getReceipt);

router.use(AuthMiddleware("admin", "staff"));

router.post("/", createPayment);
router.get("/", getAllPayments);

module.exports = router;
