const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "NOT_AUTHORIZED",
        message: "Not authorized"
      });
    }

    const roleMapping = {
      fleet_manager: 'Admin',
      safety_officer: 'Dispatcher',
      financial_analyst: 'Dispatcher',
      driver: 'Driver',
      admin: 'Admin',
      Admin: 'Admin',
      Dispatcher: 'Dispatcher',
      Driver: 'Driver'
    };

    const userMappedRole = roleMapping[req.user.role] || req.user.role;
    const mappedRequiredRoles = roles.map(r => roleMapping[r] || r);

    if (!mappedRequiredRoles.includes(userMappedRole)) {
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
