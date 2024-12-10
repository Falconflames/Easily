// 6. Create a Job model with functions for creating a new job, retrieving all jobs, finding a job by its jobId, updating a job, adding a new applicant to a job, retrieving all applicants for a job, and deleting a job.

export const jobs = [];
export let applicants = [];
export let currentApplicantId = 0;

export default class Applicant {
  constructor(applicantId, jobId, name, email, contact, resumePath) {
    this.applicantId = applicantId;
    this.jobId = jobId;
    this.name = name;
    this.email = email;
    this.contact = contact;
    this.resumePath = resumePath;
  }

  getDetails() {
    return {
      applicantId: this.applicantId,
      jobId: this.jobId,
      name: this.name,
      email: this.email,
      contact: this.contact,
      resumePath: this.resumePath,
    };
  }
}
export const applicant = new Applicant();

export const createJob = (job,userId) => {
  const newId =
    jobs.length > 0 ? Math.max(...jobs.map((job) => job.jobId)) + 1 : 1;
  const newJob = { jobId: newId, ...job, userId, applicants: [] };
  jobs.push(newJob);
  return newJob;
};

export const getAllJobs = () => {
  return jobs;
};

export const getJobsByUser = (userId) => {
  return jobs.filter((job) => job.userId === userId);
};

export const findJobById = (jobId) => {
  const foundJob = jobs.find((job) => job.jobId === +jobId);
  return foundJob;
};

export const updateJob = (jobId, updatedData) => {
  const jobIndex = jobs.findIndex((job) => job.jobId === +jobId);
  if (jobIndex !== -1) {
    jobs[jobIndex] = { ...jobs[jobIndex], ...updatedData };
    return jobs[jobIndex];
  }
  return null;
};

export const deleteJob = (jobId) => {
  const jobIndex = jobs.findIndex((job) => job.jobId === +jobId);
  if (jobIndex !== -1) {
    return jobs.splice(jobIndex, 1);
  }
  return null;
};

export const addApplicant = (jobId, name, email, contact, resumePath) => {
  const job = findJobById(jobId);
  if (job) {
    const newApplicantId =
      applicants.length > 0
        ? Math.max(...applicants.map((a) => a.applicantId)) + 1
        : 1;
    const newApplicant = { applicantId: newApplicantId, name, email, contact, resumePath, userId: job.userId  };
    applicants.push(newApplicant);
    job.applicants.push(newApplicant);
    return job;
  }
  return null;
};

export const getApplicantsForJob = (jobId) => {
  const job = jobs.find((job) => job.jobId === +jobId);
  if (!job) {
    return null;
  }
  return job.applicants || [];
};
