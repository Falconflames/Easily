import express from "express";
import path from "path";
import bodyParser from "body-parser";

import JobController from "./controllers/job.controller.js";
import UserController from "./controllers/user.controller.js";
import expressEjsLayouts from "express-ejs-layouts";
import session from "express-session";
import lastvisitMiddleware from "./middlewares/lastvisit.middleware.js";
import ensureAuthenticated from "./middlewares/auth.middleware.js";
import ValidationMiddleware from "./middlewares/validation.middleware.js";
import upload from "./middlewares/resume.middleware.js";

const app = express();

app.use(expressEjsLayouts);
app.use(
  session({
    secret: "yourSecretKey",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: !true },
  })
);
app.set("layout", "layout.ejs");

app.set("view engine", "ejs");

// Middleware to parse request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const __dirname = import.meta.dirname;
app.use(express.static(path.resolve(__dirname, "views")));
app.use("/uploads", express.static(path.resolve(__dirname, "uploads")));

// Middleware to pass user data to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Routes for user actions
app.get("/", lastvisitMiddleware, UserController.renderLandingPage);
app.get("/register", UserController.showRegistrationPage);
app.post(
  "/register",
  UserController.addUserValidation,
  ValidationMiddleware.validationMiddleware,
  UserController.addUser
);
app.get("/login", UserController.showLoginPage);
app.post(
  "/login",
  UserController.loginUserValidation,
  ValidationMiddleware.validationMiddleware,
  UserController.loginUser
);
app.post("/logout", UserController.logoutuser);

// Job listing routes
app.get("/jobs", JobController.listJobs);
app.get('/search', JobController.searchJobs);
app.get("/jobs/newJobPage", ensureAuthenticated, JobController.newJobPage);
app.post(
  "/jobPosted",
  JobController.addJobValidation,
  ValidationMiddleware.validationMiddleware,
  ensureAuthenticated,
  JobController.addJob
);
app.get("/jobPosted", ensureAuthenticated, JobController.showUserJobs);
app.get("/jobs/:jobId", JobController.getJobById);
app.put("/jobs/:jobId", ensureAuthenticated, JobController.modifyJob);
app.delete("/jobs/:jobId", ensureAuthenticated, JobController.removeJob);

// Applicant routes for a job
app.get("/jobs/:jobId/apply", JobController.renderApplication);
app.get("/jobs/:jobId/applicants", JobController.listApplicants);
app.post(
  "/jobs/:jobId/applicants",
  upload.single("resume"),
  JobController.submitApplication,
  JobController.applicantFormValidation,
  ValidationMiddleware.validationMiddleware,
  JobController.applyToJob
);
app.get(
  "/jobs/:jobId/applicants/:applicantId",
  ensureAuthenticated,
  JobController.getApplicantById
);
app.get(
  "/uploads/:filename",
  ensureAuthenticated,
  JobController.downloadResume
);
app.put(
  "/jobs/:jobId/applicants/:applicantId",
  ensureAuthenticated,
  JobController.updateApplicantById
);
app.delete(
  "/jobs/:jobId/applicants/:applicantId",
  ensureAuthenticated,
  JobController.deleteApplicantById
);

// Additional routes for job updates and deletions
app.get(
  "/jobs/:jobId/update",
  ensureAuthenticated,
  JobController.renderUpdateJobForm
);
app.post(
  "/jobs/:jobId/update",
  JobController.updateJobValidation,
  ValidationMiddleware.validationMiddleware,
  ensureAuthenticated,
  JobController.updateJobById
);
app.get("/jobs/:jobId/delete", ensureAuthenticated, JobController.removeJob);

// Render 404 Page
app.get("/404", UserController.render404Page);

// Listen on the specified port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port 3000`);
});
