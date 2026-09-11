const errorHandler = (err, req, res, next) => {
  console.error('Server Error:', err);
  const statusCode = Number.isInteger(err.status) && err.status >= 400 && err.status <= 599
    ? err.status
    : res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' && statusCode >= 500
      ? 'The request could not be completed. Please try again.'
      : err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = { errorHandler, notFound };
