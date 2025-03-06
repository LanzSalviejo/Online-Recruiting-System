const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const JobPosting = require('../models/JobPosting');
const JobApplication = require('../models/JobApplication');
const User = require('../models/User');

// Middleware to ensure user is HR staff
const hrOnly = roleCheck('hr');

// Get HR dashboard stats
router.get('/stats', [auth, hrOnly], async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get active job postings created by this HR staff
    const activeJobs = await JobPosting.countDocuments({ 
      creatorId: userId,
      isActive: true
    });
    
    // Get all job postings by this HR staff
    const jobPostings = await JobPosting.find({ creatorId: userId });
    const jobIds = jobPostings.map(job => job._id);
    
    // Get applications for these jobs
    const allApplications = await JobApplication.find({ 
      jobId: { $in: jobIds } 
    });
    
    // Calculate stats
    const stats = {
      activeJobs,
      totalApplications: allApplications.length,
      newApplications: allApplications.filter(app => 
        app.status === 'New' || app.status === 'Pending'
      ).length,
      interviewScheduled: allApplications.filter(app => 
        app.status === 'Interview'
      ).length
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching HR stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent job postings
router.get('/jobs/recent', [auth, hrOnly], async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get recent job postings by this HR staff
    const jobs = await JobPosting.find({ creatorId: userId })
      .sort({ postDate: -1 })
      .limit(5);
    
    // Get application counts for each job
    const jobsWithApplicationCounts = await Promise.all(
      jobs.map(async (job) => {
        const applicationsCount = await JobApplication.countDocuments({ jobId: job._id });
        
        // Get category name
        const category = job.category ? 
          (await JobCategory.findById(job.category)).name : 
          'Uncategorized';
        
        return {
          _id: job._id,
          title: job.title,
          category,
          location: job.location,
          applicationsCount,
          postDate: job.postDate,
          dueDate: job.dueDate
        };
      })
    );
    
    res.json(jobsWithApplicationCounts);
  } catch (error) {
    console.error('Error fetching recent job postings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent applications
router.get('/applications/recent', [auth, hrOnly], async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get job postings by this HR staff
    const jobPostings = await JobPosting.find({ creatorId: userId });
    const jobIds = jobPostings.map(job => job._id);
    
    // Get recent applications for these jobs
    const applications = await JobApplication.find({ jobId: { $in: jobIds } })
      .sort({ applicationDate: -1 })
      .limit(5);
    
    // Populate with applicant and job details
    const populatedApplications = await Promise.all(
      applications.map(async (application) => {
        const job = await JobPosting.findById(application.jobId);
        const applicant = await User.findById(application.applicantId);
        
        return {
          _id: application._id,
          jobId: job._id,
          jobTitle: job.title,
          applicantId: applicant._id,
          applicantName: `${applicant.firstName} ${applicant.lastName}`,
          status: application.status,
          applicationDate: application.applicationDate,
          screening: application.screening || null
        };
      })
    );
    
    res.json(populatedApplications);
  } catch (error) {
    console.error('Error fetching recent applications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;