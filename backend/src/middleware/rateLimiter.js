const rateLimitStore = {};

/**
 * Simple memory-based rate limiting middleware.
 * @param {Object} options - Configuration options
 * @param {number} options.windowMs - Time window in milliseconds (default 15 minutes)
 * @param {number} options.max - Maximum number of requests within the window (default 100)
 * @param {string} options.message - Error message to return when rate limit is exceeded
 */
const rateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100,
    message = 'Too many requests from this IP, please try again later.'
  } = options;

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();

    if (!rateLimitStore[ip]) {
      rateLimitStore[ip] = {
        count: 1,
        resetTime: now + windowMs
      };
      return next();
    }

    const client = rateLimitStore[ip];

    // If time window has expired, reset counter
    if (now > client.resetTime) {
      client.count = 1;
      client.resetTime = now + windowMs;
      return next();
    }

    client.count++;

    if (client.count > max) {
      return res.status(429).json({ error: message });
    }

    next();
  };
};

module.exports = rateLimiter;
