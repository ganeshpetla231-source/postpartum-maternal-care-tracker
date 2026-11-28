export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode ||
    (err.name === 'ValidationError' || err.name === 'CastError' ? 400 : err.code === 11000 ? 409 : 500);
  const message = statusCode === 500 ? 'Internal server error' : err.message || 'Request failed';

  res.status(statusCode).json({
    success: false,
    data: null,
    message,
    errors: statusCode === 500 ? ['Internal server error'] : [message]
  });
}
