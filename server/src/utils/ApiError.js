export default class ApiError extends Error {
  /**
   * @param {number} statusCode
   * @param {string} message
   * @param {Array} [errors] optional field-level validation errors
   */
  constructor(statusCode, message, errors = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg = 'Bad request', errors) {
    return new ApiError(400, msg, errors);
  }
  static unauthorized(msg = 'Not authenticated') {
    return new ApiError(401, msg);
  }
  static forbidden(msg = 'Not authorized') {
    return new ApiError(403, msg);
  }
  static notFound(msg = 'Resource not found') {
    return new ApiError(404, msg);
  }
  static conflict(msg = 'Resource already exists') {
    return new ApiError(409, msg);
  }
}
