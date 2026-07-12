const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let errorName = "INTERNAL_SERVER_ERROR";

  if (err.name === "ValidationError") {
    statusCode = 400;
    errorName = "VALIDATION_ERROR";
  } else if (err.name === "CastError") {
    statusCode = 400;
    errorName = "INVALID_ID";
  } else if (err.message && err.message.includes("append-only")) {
    statusCode = 400;
    errorName = "APPEND_ONLY_VIOLATION";
  }

  res.status(statusCode).json({
    success: false,
    error: errorName,
    message: err.message || "An unexpected error occurred."
  });
};

module.exports = errorHandler;
