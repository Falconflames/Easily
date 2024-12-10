import { validationResult } from "express-validator";

export default class ValidationMiddleware {
  static validationMiddleware(req, res, next) {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      req.validationErrors = [];
    } else {
      req.validationErrors = errors.array();
    }
    next();
  }
}

