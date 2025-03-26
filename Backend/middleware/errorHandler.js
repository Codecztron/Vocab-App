// server/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  // Log the error to the console (for debugging)
  console.error(err.stack);
  console.error("ERROR MESSAGE:", err.message);

  // Determine the status code.  Use the error's status code if available,
  // otherwise default to 500 (Internal Server Error).
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  // Create the error response
  res.json({
    message: err.message, // Error message
    stack: process.env.NODE_ENV === "production" ? "🥞" : err.stack, // Hide stack trace in production
  });
};

module.exports = errorHandler;
