const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  updatePassword,
  updateEmail,
  deactivateAccount,
  getUserById,
  getAllUsers,
  updateUser,
  deleteUser,
} = require("../controllers/user");

const Auth = require("../middlewares/auth");

router.use(Auth());

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.put("/profile/password", updatePassword);
router.put("/profile/email", updateEmail);
router.put("/profile/deactivate", deactivateAccount);

router.use(Auth("admin"));

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
