const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const JobApplication = require('../models/JobApplication');
const JobPosting = require('../models/JobPosting');
const Notification = require('../models/Notification');

// Get applicant dashboard stats
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all applications for this user
    const applications = await JobApplication.find({ applicantId: userId });
    
    // Calculate stats
    const stats = {
      totalApplications: applications.length,
      pendingApplications: applications.filter(app => 
        ['Pending', 'Under Review'].includes(app.status)
      ).length,
      interviewInvitations: applications.filter(app => 
        app.status === 'Interview'
      ).length,
      rejectedApplications: applications.filter(app => 
        app.status === 'Rejected'
      ).length
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching applicant stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent applications
router.get('/applications/recent', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get most recent applications
    const applications = await JobApplication.find({ applicantId: userId })
      .sort({ applicationDate: -1 })
      .limit(5);
    
    // Populate with job details
    const populatedApplications = await Promise.all(
      applications.map(async (application) => {
        const job = await JobPosting.findById(application.jobId);
        return {
          _id: application._id,
          jobId: job._id,
          jobTitle: job.title,
          companyName: job.companyName || 'Company Name', // Fallback
          status: application.status,
          applicationDate: application.applicationDate
        };
      })
    );
    
    res.json(populatedApplications);
  } catch (error) {
    console.error('Error fetching recent applications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get job recommendations
router.get('/recommendations', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // In a real application, you would implement a recommendation algorithm
    // For now, just return some recent job postings
    const recommendations = await JobPosting.find({ isActive: true })
      .sort({ postDate: -1 })
      .limit(3)
      .select('_id title companyName location');
    
    // Add mock match scores (in a real app, this would be calculated)
    const enhancedRecommendations = recommendations.map(job => ({
      _id: job._id,
      title: job.title,
      companyName: job.companyName || 'Company Name',
      location: job.location,
      matchScore: Math.floor(Math.random() * 30) + 70 // Random score between 70-99
    }));
    
    res.json(enhancedRecommendations);
  } catch (error) {
    console.error('Error fetching job recommendations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get notifications
router.get('/notifications', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get recent notifications for this user
    const notifications = await Notification.find({ userId })
      .sort({ date: -1 })
      .limit(5);
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;