function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const isProduction = process.env.NODE_ENV === 'production';

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors;

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    if (Array.isArray(err.errors)) {
      errors = err.errors;
    }
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired authentication token';
  }

  if (err.code === '23505') {
    statusCode = 409;
    message = 'Resource already exists';
  }

  if (err.code === '23503') {
    statusCode = 400;
    message = 'Related resource does not exist or cannot be modified';
  }

  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  if (!isProduction && err.stack) {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
}

module.exports = errorHandler;