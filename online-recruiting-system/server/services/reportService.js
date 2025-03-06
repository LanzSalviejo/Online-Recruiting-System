/**
 * Generates a monthly report of applications by category
 * @param {Number} year - The year to generate the report for
 * @param {Number} month - The month to generate the report for (1-12)
 * @returns {Array} - Sorted array of categories with application counts
 */
const generateMonthlyCategoryReport = async (year, month) => {
    try {
      // Calculate start and end dates for the given month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      // Aggregate job applications by category
      const applicationsByCategory = await JobApplication.aggregate([
        // Match applications within the date range
        {
          $match: {
            applicationDate: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        // Lookup job posting details
        {
          $lookup: {
            from: 'jobpostings',
            localField: 'jobId',
            foreignField: '_id',
            as: 'jobPosting'
          }
        },
        // Unwind job postings array
        {
          $unwind: '$jobPosting'
        },
        // Lookup category details
        {
          $lookup: {
            from: 'jobcategories',
            localField: 'jobPosting.category',
            foreignField: '_id',
            as: 'category'
          }
        },
        // Unwind category array
        {
          $unwind: '$category'
        },
        // Group by category and count applications
        {
          $group: {
            _id: '$category._id',
            categoryName: { $first: '$category.name' },
            totalApplications: { $sum: 1 },
            jobPostings: { 
              $addToSet: {
                jobId: '$jobPosting._id',
                jobTitle: '$jobPosting.title'
              }
            }
          }
        },
        // Calculate job postings count
        {
          $addFields: {
            jobPostingsCount: { $size: '$jobPostings' }
          }
        },
        // Sort by total applications (descending)
        {
          $sort: { totalApplications: -1 }
        }
      ]);
      
      return {
        reportType: 'Monthly Category Report',
        year,
        month,
        period: `${getMonthName(month)} ${year}`,
        generatedAt: new Date(),
        data: applicationsByCategory.map(cat => ({
          categoryId: cat._id,
          categoryName: cat.categoryName,
          totalApplications: cat.totalApplications,
          jobPostingsCount: cat.jobPostingsCount
        }))
      };
    } catch (error) {
      console.error('Error generating monthly category report:', error);
      throw error;
    }
  };
  
  /**
   * Generates a yearly report of applications by category
   * @param {Number} year - The year to generate the report for
   * @returns {Array} - Sorted array of categories with application counts
   */
  const generateYearlyCategoryReport = async (year) => {
    try {
      // Calculate start and end dates for the given year
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);
      
      // Aggregate job applications by category
      const applicationsByCategory = await JobApplication.aggregate([
        // Match applications within the date range
        {
          $match: {
            applicationDate: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        // Lookup job posting details
        {
          $lookup: {
            from: 'jobpostings',
            localField: 'jobId',
            foreignField: '_id',
            as: 'jobPosting'
          }
        },
        // Unwind job postings array
        {
          $unwind: '$jobPosting'
        },
        // Lookup category details
        {
          $lookup: {
            from: 'jobcategories',
            localField: 'jobPosting.category',
            foreignField: '_id',
            as: 'category'
          }
        },
        // Unwind category array
        {
          $unwind: '$category'
        },
        // Group by category and count applications
        {
          $group: {
            _id: '$category._id',
            categoryName: { $first: '$category.name' },
            totalApplications: { $sum: 1 },
            jobPostings: { 
              $addToSet: {
                jobId: '$jobPosting._id',
                jobTitle: '$jobPosting.title'
              }
            }
          }
        },
        // Calculate job postings count
        {
          $addFields: {
            jobPostingsCount: { $size: '$jobPostings' }
          }
        },
        // Sort by total applications (descending)
        {
          $sort: { totalApplications: -1 }
        }
      ]);
      
      return {
        reportType: 'Yearly Category Report',
        year,
        period: `${year}`,
        generatedAt: new Date(),
        data: applicationsByCategory.map(cat => ({
          categoryId: cat._id,
          categoryName: cat.categoryName,
          totalApplications: cat.totalApplications,
          jobPostingsCount: cat.jobPostingsCount
        }))
      };
    } catch (error) {
      console.error('Error generating yearly category report:', error);
      throw error;
    }
  };
  
  /**
   * Generates a report on how easy it is to find qualified candidates for jobs
   * This is determined by the ratio of screened-in candidates to total applications
   * @param {Number} year - The year to generate the report for
   * @param {Number} month - Optional month to generate the report for (1-12)
   * @returns {Object} - Report data with qualification rates by job
   */
  const generateQualificationRateReport = async (year, month = null) => {
    try {
      // Determine date range based on month parameter
      let startDate, endDate;
      let periodName;
      
      if (month) {
        // Monthly report
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0);
        periodName = `${getMonthName(month)} ${year}`;
      } else {
        // Yearly report
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31, 23, 59, 59);
        periodName = `${year}`;
      }
      
      // Aggregate data for qualification rate report
      const qualificationData = await JobApplication.aggregate([
        // Match applications within the date range
        {
          $match: {
            applicationDate: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        // Lookup job posting details
        {
          $lookup: {
            from: 'jobpostings',
            localField: 'jobId',
            foreignField: '_id',
            as: 'jobPosting'
          }
        },
        // Unwind job postings array
        {
          $unwind: '$jobPosting'
        },
        // Lookup category details
        {
          $lookup: {
            from: 'jobcategories',
            localField: 'jobPosting.category',
            foreignField: '_id',
            as: 'category'
          }
        },
        // Unwind category array
        {
          $unwind: '$category'
        },
        // Group by job posting and calculate qualification rates
        {
          $group: {
            _id: '$jobPosting._id',
            jobTitle: { $first: '$jobPosting.title' },
            categoryId: { $first: '$category._id' },
            categoryName: { $first: '$category.name' },
            totalApplications: { $sum: 1 },
            qualifiedApplications: {
              $sum: { $cond: [{ $eq: ['$passedScreening', true] }, 1, 0] }
            }
          }
        },
        // Calculate qualification rate
        {
          $addFields: {
            qualificationRate: {
              $cond: [
                { $gt: ['$totalApplications', 0] },
                { $divide: ['$qualifiedApplications', '$totalApplications'] },
                0
              ]
            }
          }
        },
        // Sort by qualification rate (ascending) - hardest to easiest
        {
          $sort: { qualificationRate: 1 }
        }
      ]);
      
      return {
        reportType: month ? 'Monthly Qualification Rate Report' : 'Yearly Qualification Rate Report',
        year,
        month,
        period: periodName,
        generatedAt: new Date(),
        data: qualificationData.map(job => ({
          jobId: job._id,
          jobTitle: job.jobTitle,
          categoryId: job.categoryId,
          categoryName: job.categoryName,
          totalApplications: job.totalApplications,
          qualifiedApplications: job.qualifiedApplications,
          qualificationRate: Math.round(job.qualificationRate * 100) / 100,
          qualificationPercentage: `${Math.round(job.qualificationRate * 100)}%`,
          difficulty: getQualificationDifficulty(job.qualificationRate)
        }))
      };
    } catch (error) {
      console.error('Error generating qualification rate report:', error);
      throw error;
    }
  };
  
  /**
   * Helper function to determine the difficulty level based on qualification rate
   * @param {Number} rate - Qualification rate between 0 and 1
   * @returns {String} - Difficulty level description
   */
  const getQualificationDifficulty = (rate) => {
    if (rate < 0.10) return 'Very Hard';
    if (rate < 0.25) return 'Hard';
    if (rate < 0.50) return 'Moderate';
    if (rate < 0.75) return 'Easy';
    return 'Very Easy';
  };
  
  /**
   * Helper function to get month name from month number
   * @param {Number} month - Month number (1-12)
   * @returns {String} - Month name
   */
  const getMonthName = (month) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return monthNames[month - 1];
  };
  
  /**
   * Export report generation functions
   */
  module.exports = {
    generateMonthlyCategoryReport,
    generateYearlyCategoryReport,
    generateQualificationRateReport
  };