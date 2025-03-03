import React, { useState, useEffect } from "react";
import { Card, Alert, Button, FormInput, Layout } from "./components";
import {
  JobService,
  ApplicationService,
  CategoryService,
  AuthService,
} from "./services";

// Applicant Dashboard
export function ApplicantDashboard() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(AuthService.getCurrentUser());

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch recent job postings
        const jobsResponse = await JobService.getJobs({ limit: 5 });
        setJobs(jobsResponse.results || jobsResponse);

        // Fetch user's applications
        const applicationsResponse = await ApplicationService.getApplications();
        setApplications(applicationsResponse.results || applicationsResponse);

        setLoading(false);
      } catch (error) {
        setError("Failed to fetch dashboard data");
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Layout user={user}>
        <div className="p-6">Loading...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout user={user}>
        <div className="p-6">
          <Alert type="error" message={error} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      <div className="container p-6">
        <h1 className="text-2xl font-bold mb-6">Applicant Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Recent Job Postings">
            {jobs.length === 0 ? (
              <p>No job postings available.</p>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div key={job.postID} className="border-b pb-4">
                    <h3 className="font-medium">{job.title}</h3>
                    <p className="text-sm text-gray-600">
                      {job.location} • {job.positionType}
                    </p>
                    <p className="text-sm">
                      ${job.salary} • Due:{" "}
                      {new Date(job.dueDate).toLocaleDateString()}
                    </p>
                    <div className="mt-2">
                      <Button
                        variant="primary"
                        onClick={() =>
                          (window.location.href = `/applicant/jobs/${job.postID}`)
                        }
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4">
              <Button
                variant="secondary"
                onClick={() => (window.location.href = "/applicant/jobs")}
              >
                View All Jobs
              </Button>
            </div>
          </Card>

          <Card title="Your Applications">
            {applications.length === 0 ? (
              <p>You haven't submitted any applications yet.</p>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => (
                  <div
                    key={application.applicationID}
                    className="border-b pb-4"
                  >
                    <h3 className="font-medium">{application.jobTitle}</h3>
                    <p className="text-sm text-gray-600">
                      Applied:{" "}
                      {new Date(
                        application.applicationDate
                      ).toLocaleDateString()}
                    </p>
                    <p className="text-sm">
                      Status:
                      <span
                        className={
                          application.passedScreen === "YES"
                            ? "text-green-600 ml-1"
                            : application.passedScreen === "NO"
                            ? "text-red-600 ml-1"
                            : "text-yellow-600 ml-1"
                        }
                      >
                        {application.passedScreen === "YES"
                          ? "Qualified"
                          : application.passedScreen === "NO"
                          ? "Not Qualified"
                          : "Pending"}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4">
              <Button
                variant="secondary"
                onClick={() =>
                  (window.location.href = "/applicant/applications")
                }
              >
                View All Applications
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

// Job List Page
export function JobListPage() {
  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(AuthService.getCurrentUser());

  // Filter state
  const [filters, setFilters] = useState({
    category: "",
    location: "",
    positionType: "",
    minSalary: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch job categories
        const categoriesResponse = await CategoryService.getCategories();
        setCategories(categoriesResponse);

        // Fetch jobs with filters
        const jobsResponse = await JobService.getJobs(filters);
        setJobs(jobsResponse.results || jobsResponse);

        setLoading(false);
      } catch (error) {
        setError("Failed to fetch data");
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      location: "",
      positionType: "",
      minSalary: "",
    });
  };

  if (loading) {
    return (
      <Layout user={user}>
        <div className="p-6">Loading...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout user={user}>
        <div className="p-6">
          <Alert type="error" message={error} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      <div className="container p-6">
        <h1 className="text-2xl font-bold mb-6">Job Listings</h1>

        <Card title="Filters" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.category} value={category.category}>
                    {category.category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                placeholder="Enter location"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position Type
              </label>
              <select
                name="positionType"
                value={filters.positionType}
                onChange={handleFilterChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">All Types</option>
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="COOP">Co-op</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Salary
              </label>
              <input
                type="number"
                name="minSalary"
                value={filters.minSalary}
                onChange={handleFilterChange}
                placeholder="Minimum salary"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="secondary" onClick={clearFilters} className="mr-2">
              Clear Filters
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          {jobs.length === 0 ? (
            <p>No job postings found.</p>
          ) : (
            jobs.map((job) => (
              <Card key={job.postID} className="mb-4">
                <div className="flex flex-col md:flex-row md:justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{job.title}</h2>
                    <p className="text-gray-600">
                      {job.category} • {job.location}
                    </p>
                    <p className="text-gray-600">{job.positionType}</p>
                    <p className="mt-2">${job.salary} per year</p>
                    <p className="text-sm text-gray-500">
                      Posted: {new Date(job.postDate).toLocaleDateString()} •
                      Due: {new Date(job.dueDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="mt-4 md:mt-0">
                    <Button
                      variant="primary"
                      onClick={() =>
                        (window.location.href = `/applicant/jobs/${job.postID}`)
                      }
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}

// Job Detail Page
export function JobDetailPage({ jobId }) {
  const [job, setJob] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applicationData, setApplicationData] = useState({
    education: "",
    workExperience: "",
    jobSpecificInfo: "",
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [user, setUser] = useState(AuthService.getCurrentUser());

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch job details
        const jobData = await JobService.getJobById(jobId);
        setJob(jobData);

        // Check if user has already applied
        const applications = await ApplicationService.getApplications();
        setHasApplied(
          applications.some((app) => app.postID === parseInt(jobId))
        );

        // Get user profile for pre-filling application
        const userData = AuthService.getCurrentUser();
        if (userData) {
          setApplicationData((prev) => ({
            ...prev,
            education: userData.education || "",
            workExperience: userData.workExperience || "",
          }));
        }

        setLoading(false);
      } catch (error) {
        setError("Failed to fetch job details");
        setLoading(false);
      }
    };

    fetchData();
  }, [jobId]);

  const handleApplicationChange = (e) => {
    const { name, value } = e.target;
    setApplicationData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();

    if (!applicationData.education || !applicationData.workExperience) {
      setSubmitError("Please fill in all required fields");
      return;
    }

    try {
      setSubmitLoading(true);
      setSubmitError(null);

      await ApplicationService.submitApplication({
        postID: jobId,
        education: applicationData.education,
        workExperience: applicationData.workExperience,
        jobSpecificInfo: applicationData.jobSpecificInfo,
      });

      setSubmitSuccess(true);
      setHasApplied(true);
    } catch (error) {
      setSubmitError(error.message || "Failed to submit application");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout user={user}>
        <div className="p-6">Loading...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout user={user}>
        <div className="p-6">
          <Alert type="error" message={error} />
        </div>
      </Layout>
    );
  }

  if (!job) {
    return (
      <Layout user={user}>
        <div className="p-6">Job not found</div>
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      <div className="container p-6">
        <div className="mb-6">
          <Button
            variant="secondary"
            onClick={() => (window.location.href = "/applicant/jobs")}
          >
            Back to Jobs
          </Button>
        </div>

        <Card title={job.title} className="mb-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Job Details</h3>
              <p className="text-gray-600">
                {job.category} • {job.location}
              </p>
              <p className="text-gray-600">{job.positionType}</p>
              <p className="mt-2">${job.salary} per year</p>
              <p className="text-sm text-gray-500">
                Posted: {new Date(job.postDate).toLocaleDateString()} • Due:{" "}
                {new Date(job.dueDate).toLocaleDateString()}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium">Job Description</h3>
              <p className="whitespace-pre-line">{job.jobDescription}</p>
            </div>

            <div>
              <h3 className="text-lg font-medium">Requirements</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Education: {job.minimalRequiredEducationLevel}</li>
                <li>
                  Experience: {job.minimalRequiredWorkingExperience} years
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium">Contact</h3>
              <p>{job.contactEmail}</p>
            </div>
          </div>
        </Card>

        {!hasApplied ? (
          <Card title="Apply for this Position">
            {submitSuccess ? (
              <Alert
                type="success"
                message="Your application has been submitted successfully!"
              />
            ) : (
              <form onSubmit={handleSubmitApplication}>
                {submitError && <Alert type="error" message={submitError} />}

                <FormInput
                  id="education"
                  label="Education"
                  value={applicationData.education}
                  onChange={handleApplicationChange}
                  required
                  placeholder="e.g., Bachelor's in Computer Science, Stanford University"
                />

                <FormInput
                  id="workExperience"
                  label="Work Experience (years)"
                  type="number"
                  value={applicationData.workExperience}
                  onChange={handleApplicationChange}
                  required
                  placeholder="e.g., 3"
                />

                <div className="mb-4">
                  <label
                    htmlFor="jobSpecificInfo"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Additional Information
                  </label>
                  <textarea
                    id="jobSpecificInfo"
                    name="jobSpecificInfo"
                    rows="4"
                    value={applicationData.jobSpecificInfo}
                    onChange={handleApplicationChange}
                    placeholder="Include any additional information relevant to your application"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitLoading}
                >
                  {submitLoading ? "Submitting..." : "Submit Application"}
                </Button>
              </form>
            )}
          </Card>
        ) : (
          <Card>
            <Alert
              type="info"
              message="You have already applied for this position."
            />
          </Card>
        )}
      </div>
    </Layout>
  );
}

// Applications List Page
export function ApplicationsListPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(AuthService.getCurrentUser());

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await ApplicationService.getApplications();
        setApplications(response.results || response);
        setLoading(false);
      } catch (error) {
        setError("Failed to fetch applications");
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const handleWithdrawApplication = async (applicationId) => {
    if (window.confirm("Are you sure you want to withdraw this application?")) {
      try {
        await ApplicationService.withdrawApplication(applicationId);
        setApplications(
          applications.filter((app) => app.applicationID !== applicationId)
        );
      } catch (error) {
        alert("Failed to withdraw application");
      }
    }
  };

  if (loading) {
    return (
      <Layout user={user}>
        <div className="p-6">Loading...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout user={user}>
        <div className="p-6">
          <Alert type="error" message={error} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      <div className="container p-6">
        <h1 className="text-2xl font-bold mb-6">My Applications</h1>

        {applications.length === 0 ? (
          <Card>
            <p>You haven't submitted any applications yet.</p>
            <div className="mt-4">
              <Button
                variant="primary"
                onClick={() => (window.location.href = "/applicant/jobs")}
              >
                Browse Jobs
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <Card key={application.applicationID}>
                <div className="flex flex-col md:flex-row md:justify-between">
                  <div>
                    <h2 className="text-xl font-bold">
                      {application.jobTitle}
                    </h2>
                    <p className="text-gray-600">
                      Applied:{" "}
                      {new Date(
                        application.applicationDate
                      ).toLocaleDateString()}
                    </p>
                    <p className="mt-2">
                      Status:
                      <span
                        className={
                          application.passedScreen === "YES"
                            ? "text-green-600 ml-1"
                            : application.passedScreen === "NO"
                            ? "text-red-600 ml-1"
                            : "text-yellow-600 ml-1"
                        }
                      >
                        {application.passedScreen === "YES"
                          ? "Qualified"
                          : application.passedScreen === "NO"
                          ? "Not Qualified"
                          : "Pending"}
                      </span>
                    </p>
                  </div>

                  <div className="mt-4 md:mt-0">
                    <Button
                      variant="danger"
                      onClick={() =>
                        handleWithdrawApplication(application.applicationID)
                      }
                    >
                      Withdraw
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
