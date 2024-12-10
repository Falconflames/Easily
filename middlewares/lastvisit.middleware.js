// Middleware to track user's last visit
import { updateLastVisit } from "../models/user.model.js";
const trackLastVisit = (req, res, next) => {
  const currentVisit = new Date();
  const user = req.session.user;
  if (user) {
    if (req.session.lastVisit) {
      req.session.previousVisit = req.session.lastVisit;
    }
    updateLastVisit(user.id, new Date().toISOString());
    req.session.lastVisit = currentVisit;
  }
  next();
};

export default trackLastVisit;
