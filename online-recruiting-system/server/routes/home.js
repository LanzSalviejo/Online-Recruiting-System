const express = require('express');
const router = express.Router();
const JobPosting = require('../models/JobPosting');
const JobCategory = require('../models/JobCategory');
const User = require('../models/User');

// Get featured job listings
router.get('/jobs/featured', async (req, res) => {
  try {
    // Get featured or recent active jobs
    const featuredJobs = await JobPosting.find({ 
      isActive: true,
      dueDate: { $gte: new Date() }
    })
    .sort({ postDate: -1 })
    .limit(6)
    .select('_id title companyName location positionType description postDate');
    
    res.json(featuredJobs);
  } catch (error) {
    console.error('Error fetching featured jobs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get job categories with job counts
router.get('/jobs/categories', async (req, res) => {
  try {
    // Get all categories
    const categories = await JobCategory.find()
      .select('_id name');
    
    // Get job counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const jobCount = await JobPosting.countDocuments({ 
          category: category._id,
          isActive: true,
          dueDate: { $gte: new Date() }
        });
        
        return {
          _id: category._id,
          name: category.name,
          jobCount
        };
      })
    );
    
    // Sort by job count (descending)
    categoriesWithCounts.sort((a, b) => b.jobCount - a.jobCount);
    
    res.json(categoriesWithCounts);
  } catch (error) {
    console.error('Error fetching job categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get platform statistics
router.get('/stats/platform', async (req, res) => {
  try {
    // Calculate platform stats
    const totalJobs = await JobPosting.countDocuments({ 
      isActive: true,
      dueDate: { $gte: new Date() }
    });
    
    // Count unique companies
    const uniqueCompanies = await JobPosting.distinct('companyName');
    const totalCompanies = uniqueCompanies.length;
    
    // Count total applicants
    const totalApplicants = await User.countDocuments({ accountType: 'applicant' });
    
    // Count jobs posted this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const jobsThisMonth = await JobPosting.countDocuments({
      postDate: { $gte: startOfMonth }
    });
    
    const stats = {
      totalJobs,
      totalCompanies,
      totalApplicants,
      jobsThisMonth
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;