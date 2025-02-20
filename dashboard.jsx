import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Dashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/jobs/");
      const data = await response.json();
      setJobs(data);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch dashboard data");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-4">
      <Card className="mb-4">
        <CardHeader>
          <h2 className="text-2xl font-bold">Recent Job Postings</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Your Applications</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {applications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const JobCard = ({ job }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <h3 className="text-xl font-semibold">{job.title}</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-gray-600">{job.company}</p>
          <p className="text-sm">{job.location}</p>
          <p className="text-sm font-medium">
            ${job.salary_range_min} - ${job.salary_range_max}
          </p>
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-500">
              Posted {new Date(job.post_date).toLocaleDateString()}
            </span>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Apply Now
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ApplicationCard = ({ application }) => {
  return (
    <Card>
      <CardContent className="flex justify-between items-center p-4">
        <div>
          <h3 className="font-semibold">{application.job_posting.title}</h3>
          <p className="text-sm text-gray-500">
            Applied on{" "}
            {new Date(application.application_date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center">
          <span
            className={`px-3 py-1 rounded-full text-sm ${
              application.status === "PENDING"
                ? "bg-yellow-100 text-yellow-800"
                : application.status === "ACCEPTED"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {application.status}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default Dashboard;
