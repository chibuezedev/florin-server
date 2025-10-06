const jwt = require("jsonwebtoken");
const User = require("../models/user");

const AuthMiddleware = (requiredRole = null) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "Access denied. No token provided",
        });
      }

      const token = authHeader.split(" ")[1];

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      } catch (error) {
        if (error.name === "TokenExpiredError") {
          return res.status(401).json({
            success: false,
            message: "Token expired",
            code: "TOKEN_EXPIRED",
          });
        }
        return res.status(401).json({
          success: false,
          message: "Invalid token",
        });
      }

      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User no longer exists",
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Account is deactivated",
        });
      }

      if (requiredRole) {
        const roles = Array.isArray(requiredRole)
          ? requiredRole
          : [requiredRole];

        if (!roles.includes(user.role)) {
          return res.status(403).json({
            success: false,
            message: "Access denied. Insufficient permissions",
            requiredRole: roles,
            userRole: user.role,
          });
        }
      }

      req.user = {
        userId: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
      };

      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      res.status(500).json({
        success: false,
        message: "Authentication failed",
      });
    }
  };
};

module.exports = AuthMiddleware;
