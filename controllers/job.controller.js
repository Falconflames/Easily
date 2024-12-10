// 7. Create a Job controller to interface with the Job model to create, update and delete jobs, and to manage job applicants.
import Applicant, {
  createJob,
  updateJob,
  deleteJob,
  findJobById,
  addApplicant,
  getAllJobs,
  getApplicantsForJob,
  getJobsByUser,
  jobs,
  applicants,
  currentApplicantId,
} from "../models/job.model.js";
import sendEmail from "../middlewares/mailer.middleware.js";
import { validationResult, body } from "express-validator";

class JobController {
  // Method to handle job creation
  newJobPage(req, res) {
    try {
      res.status(200).render("newJobPage", { errors: [] });
    } catch (error) {
      res.status(500).send("Server error");
    }
  }

  addJobValidation = [
    body("jobcategory").notEmpty().withMessage("Category is required"),
    body("jobdesignation").notEmpty().withMessage("Designation is required"),
    body("joblocation").notEmpty().withMessage("Joblocation is required"),
    body("companyname").notEmpty().withMessage("Companyname are required"),
    body("salary").notEmpty().withMessage("Salary are required"),
    body("deadline").notEmpty().withMessage("Deadline are required"),
    body("skills").notEmpty().withMessage("Skills are required"),
    body("openings").notEmpty().withMessage("Number of openings are required"),
  ];
  addJob = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render("newJobPage", { errors: errors.array() });
    }
    try {
      req.body.skills = req.body.skills
        .split(",")
        .map((skill) => skill.trim().toLowerCase());
      req.body.jobdesignation = req.body.jobdesignation.toLowerCase();
      req.body.companyname = req.body.companyname.toLowerCase();
      req.body.joblocation = req.body.joblocation.toLowerCase();
      const job = await createJob(req.body, req.session.user.id);
      if (job) {
        const userId = req.session.user.id;
        const jobs = getJobsByUser(userId);

        const page = 1;
        const limit = 8;
        const { paginatedJobs, totalJobs, totalPages } = this.paginateJobs(
          jobs,
          page,
          limit
        );

        res.status(200).render("jobPosted", {
          jobs: paginatedJobs,
          currentPage: page,
          totalPages: totalPages,
          totalJobs: totalJobs,
          showSearch: true,
          query: "",
          message: "",
        });
      }
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to create job", error: error.message });
    }
  };

  getJobById = async (req, res) => {
    const { jobId } = req.params; // Extracting the job ID from request parameters
    try {
      const job = await findJobById(jobId);
      if (job) {
        const appLength = job.applicants.length;
        res
          .status(200)
          .render("jobDetailsPage", { job: job, appLength: appLength });
      } else {
        res.status(404).render("404Page", { errors: [] });
      }
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to retrieve the job", error: error.message });
    }
  };

  // Method to handle job update
  modifyJob = async (req, res) => {
    const { jobId } = req.params;
    const job = await findJobById(jobId);
    if (job.userId !== req.session.user.id) {
      return res
        .status(403)
        .json({ message: "Unauthorized to modify this job" });
    }

    try {
      const updatedJob = await updateJob(jobId, req.body);
      if (updatedJob) {
        res
          .status(200)
          .json({ message: "Job Updated Successfully", error: null });
      } else {
        res.status(400).json({ message: "Job Not Found", error: null });
      }
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to update job", error: error.message });
    }
  };

  // Method to handle job deletion
  removeJob = async (req, res) => {
    const { jobId } = req.params;
    const job = await findJobById(jobId);

    if (job.userId !== req.session.user.id) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this job" });
    }
    try {
      const deletedJob = deleteJob(jobId);
      if (deletedJob) {
        const userId = req.session.user.id;
        const jobs = getJobsByUser(userId);

        const page = 1;
        const limit = 8;
        const { paginatedJobs, totalJobs, totalPages } = this.paginateJobs(
          jobs,
          page,
          limit
        );

        res.status(200).render("jobPosted", {
          jobs: paginatedJobs,
          currentPage: page,
          totalPages: totalPages,
          totalJobs: totalJobs,
          showSearch: true,
          query: "",
          message: "Job deleted successfully.",
        });
      }
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to delete job", error: error.message });
    }
  };

  // Method to handle adding an applicant to a job
  applicantFormValidation = [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Email is required"),
    body("contact").notEmpty().withMessage("Contact is required"),
    body("resume").custom((value, { req }) => {
      if (!req.file) {
        throw new Error("Resume is required");
      }
      return true;
    }),
  ];
  applyToJob = async (req, res) => {
    const { jobId } = req.params;
    const { name, email, contact } = req.body;
    const resumePath = req.file.filename;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .render("applicantForm", { jobId: jobId, errors: errors.array() });
    }
    try {
      const job = await addApplicant(jobId, name, email, contact, resumePath);
      await sendEmail(email);
      if (job) {
        const page = parseInt(req.query.page) || 1;
        const query = req.query.query || "";
        const limit = 8;

        const jobs = getAllJobs();
        jobs.forEach((job) => {
          job.appLength = job.applicants.length;
        });

        const { paginatedJobs, totalJobs, totalPages } = this.paginateJobs(
          jobs,
          page,
          limit
        );
        return res.render("jobListingPage", {
          jobs: paginatedJobs,
          currentPage: page,
          totalPages: totalPages,
          totalJobs: totalJobs,
          showSearch: true,
          query: query,
          message: "Successfully applied to the job",
        });
      } else {
        return res.status(404).render("404Page", { errors: [] });
      }
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to apply to job", error: error.message });
    }
  };

  // Method to retrieve all jobs
  listJobs = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const query = req.query.query || "";
    const limit = 8;
    try {
      if (query) {
        return await searchJobs(req, res);
      }
      const jobs = getAllJobs();
      if (!jobs || jobs.length === 0) {
        return res.render("jobListingPage", {
          jobs: [],
          currentPage: page,
          totalPages: 0,
          totalJobs: 0,
          showSearch: false,
          message: "No jobs posted yet",
          query: query,
        });
      }
      jobs.forEach((job) => {
        job.appLength = job.applicants.length;
      });
      const { paginatedJobs, totalJobs, totalPages } = this.paginateJobs(
        jobs,
        page,
        limit
      );

      res.render("jobListingPage", {
        jobs: paginatedJobs,
        currentPage: page,
        totalPages: totalPages,
        totalJobs: totalJobs,
        showSearch: true,
        query: query,
        message: "",
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to retrieve jobs", error: error.message });
    }
  };

  showUserJobs = async (req, res) => {
    console.log("Session User:", req.session.user);
    const userId = req.session.user.id;
    const page = parseInt(req.query.page) || 1;
    const query = req.query.query || "";
    const limit = 8;
    try {
      if (query) {
        return await searchJobs(req, res);
      }
      const jobs = getJobsByUser(userId);
      console.log("Jobs Posted By User:", jobs);

      if (!jobs || jobs.length === 0) {
        return res.render("jobPosted", {
          jobs: [],
          currentPage: page,
          totalPages: 0,
          totalJobs: 0,
          showSearch: false,
          query: query,
          message: "You have not posted any jobs yet.",
        });
      }

      jobs.forEach((job) => {
        job.appLength = job.applicants.length;
      });
      const { paginatedJobs, totalJobs, totalPages } = this.paginateJobs(
        jobs,
        page,
        limit
      );

      res.render("jobPosted", {
        jobs: paginatedJobs,
        currentPage: page,
        totalPages: totalPages,
        totalJobs: totalJobs,
        showSearch: true,
        query: query,
        message: "",
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Failed to retrieve jobs posted by user.");
    }
  };

  renderUpdateJobForm = async (req, res) => {
    const { jobId } = req.params;
    try {
      if (jobId) {
        res.status(200).render("updateJobPage", { jobId: jobId, errors: null });
      }
    } catch {
      res.status(500).send("Failed to retreive Job");
    }
  };

  updateJobValidation = [
    body("jobcategory").notEmpty().withMessage("Category is required"),
    body("jobdesignation").notEmpty().withMessage("Designation is required"),
    body("joblocation").notEmpty().withMessage("Joblocation is required"),
    body("companyname").notEmpty().withMessage("Companyname are required"),
    body("salary").notEmpty().withMessage("Salary are required"),
    body("deadline").notEmpty().withMessage("Deadline are required"),
    body("skills").notEmpty().withMessage("Skills are required"),
    body("openings").notEmpty().withMessage("Number of openings are required"),
  ];

  updateJobById = async (req, res) => {
    const { jobId } = req.params;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .render("updateJobPage", { errors: errors.array() });
    }
    req.body.skills = req.body.skills.split(",").map((skill) => skill.trim());

    try {
      const updatedJob = await updateJob(jobId, req.body);

      if (updatedJob) {
        const userId = req.session.user.id;
        const jobs = getJobsByUser(userId);

        const page = 1;
        const limit = 8;
        const { paginatedJobs, totalJobs, totalPages } = this.paginateJobs(
          jobs,
          page,
          limit
        );

        res.render("jobPosted", {
          jobs: paginatedJobs,
          currentPage: page,
          totalPages: totalPages,
          totalJobs: totalJobs,
          showSearch: true,
          query: "",
          message: "Job updated successfully.",
        });
      } else {
        res.status(404).render("404Page", { errors: ["Job not found."] });
      }
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to update job", error: error.message });
    }
  };

  // Method to get applicants for a specific job
  listApplicants = async (req, res) => {
    const { jobId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 8;

    try {
      const job = await findJobById(jobId);

      if (job.userId !== req.session.user.id) {
        return res
          .status(403)
          .json({ message: "Unauthorized to view applicants for this job" });
      }
      const applicants = await getApplicantsForJob(jobId);
      if (!applicants || applicants.length === 0) {
        return res.status(200).render("applicantListPage", {
          job: job,
          applicants: [],
          currentPage: page,
          totalPages: 0,
          showSearch: false,
          message: "No applicants have applied for this job yet.",
          query: "",
        });
      }
      const { paginatedJobs, totalJobs, totalPages } = this.paginateJobs(
        applicants,
        page,
        limit
      );

      if (job && paginatedJobs) {
        res.status(200).render("applicantListPage", {
          job: job,
          applicants: paginatedJobs,
          currentPage: page,
          showSearch: true,
          totalPages: totalPages,
          message: "",
          query: "",
        });
      } else {
        res.status(404).render("404Page", { errors: [] });
      }
    } catch (error) {
      res.status(500).json({
        message: "Failed to retrieve applicants",
        error: error.message,
      });
    }
  };

  renderApplication = async (req, res) => {
    const { jobId } = req.params;
    try {
      const job = await findJobById(jobId);
      if (job) {
        res.status(200).render("applicantForm", { jobId: jobId, errors: null });
      }
    } catch {
      res.status(500).send("Failed to retreive Job");
    }
  };

  submitApplication = (req, res, next) => {
    const { jobId } = req.params;
    const { name, email, contact } = req.body;
    const resumePath = req.file?.filename;
    let applicantId = currentApplicantId;
    const newApplicant = new Applicant(
      applicantId,
      jobId,
      name,
      email,
      contact,
      resumePath
    );
    applicants.push(newApplicant.getDetails());
    next();
  };

  getApplicantById = (req, res) => {
    const { jobId, applicantId } = req.params;
    console.log("jobId:", jobId);
    console.log("applicantId:", applicantId);

    const job = findJobById(jobId);
    console.log("job:", job);
    const applicant = job.applicants.find(
      (applicant) => applicant.applicantId == applicantId
    );
    console.log("applicant:", applicant);

    if (applicant) {
      res.status(200).render("applicantDetailPage", {
        job: job,
        applicant: applicant,
      });
    } else {
      res.status(400).send("No such applicant");
    }
  };

  downloadResume = (req, res) => {
    const { filename } = req.params;
    console.log(req.params);
    const filePath = path.resolve(__dirname, "uploads", filename);
    console.log(filePath);
    if (fs.existsSync(filePath)) {
      res.setHeader("Content-Type", "application/pdf").sendFile(filePath);
    } else {
      res.status(404).send("File not found");
    }
  };

  updateApplicantById = (req, res) => {
    const { jobId, applicantId } = req.params;
    const { name, email, contact, resumePath } = req.body;

    const job = jobs.find((job) => job.id === parseInt(jobId));
    if (!job) {
      return res.status(400).send("Job not found");
    }

    const applicantIndex = job.applicants.findIndex(
      (applicant) => applicant.applicantId === parseInt(applicantId)
    );
    if (applicantIndex === -1) {
      return res.status(400).send("Applicant not found within the job");
    }

    const updatedApplicant = {
      ...job.applicants[applicantIndex],
      name,
      email,
      contact,
      resumePath,
    };
    job.applicants[applicantIndex] = updatedApplicant;

    res.status(200).send("Applicant updated successfully");
  };

  deleteApplicantById = (req, res) => {
    const { jobId, applicantId } = req.params;

    const index = applicants.findIndex(
      (applicant) =>
        applicant.applicantId == applicantId && applicant.jobId == jobId
    );

    if (index !== -1) {
      applicants.splice(index, 1);
      res.status(200).send("Applicant deleted successfully.");
    } else {
      res.status(404).send("No such applicant found.");
    }
  };

  // Pagination helper function
  paginateJobs(array, page, limit) {
    const skip = (page - 1) * limit;
    const paginatedJobs = array.slice(skip, skip + limit);
    const totalJobs = array.length;
    const totalPages = Math.ceil(totalJobs / limit);

    return {
      paginatedJobs,
      totalJobs,
      totalPages,
    };
  }

  // Method to handle search input
  searchJobs = async (req, res) => {
    const query = req.query.query || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 8;

    try {
      let allJobs = getAllJobs();

      if (allJobs.length === 0) {
        return res.render("jobListingPage", {
          jobs: [],
          query: query,
          currentPage: page,
          totalPages: 0,
          showSearch: false,
          message: "No jobs posted yet.",
        });
      }

      let filteredJobs = allJobs;
      if (query) {
        filteredJobs = allJobs.filter((job) => {
          const jobDesignation = job.jobdesignation || "";
          const companyName = job.companyname || "";
          const jobLocation = job.joblocation || "";
          const skills = job.skills || [];

          return (
            jobDesignation.toLowerCase().includes(query.toLowerCase()) ||
            companyName.toLowerCase().includes(query.toLowerCase()) ||
            jobLocation.toLowerCase().includes(query.toLowerCase()) ||
            skills.some((skill) =>
              skill.toLowerCase().includes(query.toLowerCase())
            )
          );
        });
      }

      if (filteredJobs.length === 0) {
        return res.render("jobListingPage", {
          jobs: [],
          query: query,
          currentPage: page,
          totalPages: 0,
          showSearch:true,
          message: `No jobs found matching "${query}".`,
        });
      }

      const { paginatedJobs, totalPages } = this.paginateJobs(
        filteredJobs,
        page,
        limit
      );

      res.render("jobListingPage", {
        jobs: paginatedJobs,
        query: query,
        currentPage: page,
        totalPages: totalPages,
        showSearch: true,
        message: null,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to search jobs",
        error: error.message,
      });
    }
  };
}
export default new JobController();
