import {
  getAllUsers,
  registerUser,
  authenticateUser,
  updateLastVisit,
} from "../models/user.model.js";
import { validationResult, body } from "express-validator";
class UserController {
  render404Page = async (req, res) => {
    res.render("404Page");
  };

  renderLandingPage = async (req, res) => {
    const user = req.session.user || null;
    const name = user ? user.name : null;

    const previousVisit =
      user && user.lastVisit ? new Date(user.lastVisit).toLocaleString() : null;

    res.render("landing", {
      user: user,
      previousVisit,
      name,
    });
  };

  showRegistrationPage = async (req, res) => {
    try {
      res.render("registerPage", { errors: [] });
    } catch (error) {
      res.status(500).send("Server error");
    }
  };

  addUserValidation = [
    body("name").notEmpty().withMessage("Username is required"),
    body("email").isEmail().withMessage("Invalid email address"),
    body("password").notEmpty().withMessage("Password is required"),
  ];

  addUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render("registerPage", { errors: errors.array() });
    }
    try {
      const existingUser = await registerUser(req.body);
      if (existingUser.error) {
        return res.status(400).render("registerPage", {
          errors: [{ msg: existingUser.error }],
        });
      }
      res.status(200).render("loginPage", { errors: [] });
    } catch (error) {
      res.status(500).send("Server error");
    }
  };
  showLoginPage = async (req, res) => {
    try {
      if (req.session.user) {
        return res.redirect("/");
      }
      res.status(200).render("loginPage", { errors: [] });
    } catch (error) {
      res.status(500).send("Server error");
    }
  };

  loginUserValidation = [
    body("email").isEmail().withMessage("Invalid email address"),
    body("password").notEmpty().withMessage("Password is required"),
  ];

  loginUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render("loginPage", { errors: errors.array() });
    }
    try {
      const user = await authenticateUser(req.body);

      if (user.error) {
        return res.status(400).render("loginPage", {
          errors: [{ msg: user.error }],
        });
      }

      req.session.user = user;
      const redirectUrl = req.session.redirectTo || "/jobPosted";
      delete req.session.redirectTo;

      console.log("User logged in successfully");
      return res.redirect(redirectUrl);
    } catch (error) {
      console.log(error);
      res.status(500).send("Server error");
    }
  };

  logoutuser = (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).send("Error logging out");
      }
      console.log("User logged out successfully");
      res.redirect("/");
    });
  };
}
export default new UserController();
