import ApiError from '../utils/ApiError.js';
import { isProd } from '../config/env.js';

export function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors;

  // Postgres: invalid input syntax (e.g. a malformed uuid slipping past validation)
  if (err.pgCode === '22P02') {
    statusCode = 400;
    message = 'Invalid value in request';
  }

  // Postgres: unique_violation
  if (err.pgCode === '23505') {
    statusCode = 409;
    message = 'A record with that value already exists';
  }

  // Postgres: foreign_key_violation (e.g. deleting a still-referenced row)
  if (err.pgCode === '23503') {
    statusCode = 400;
    message = 'This record is still referenced by other data';
  }

  // Postgres: check_violation / not_null_violation
  if (err.pgCode === '23514' || err.pgCode === '23502') {
    statusCode = 400;
    message = 'Validation failed';
  }

  // JWT
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session expired, please log in again';
  }

  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error('💥', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
    ...(isProd ? {} : { stack: err.stack }),
  });
}
