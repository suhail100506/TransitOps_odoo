const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "NOT_AUTHORIZED",
        message: "Not authorized"
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "FORBIDDEN",
        message: `Access denied. Required roles: ${roles.join(", ")}`
      });
    }

    next();
  };
};

module.exports = authorize;
