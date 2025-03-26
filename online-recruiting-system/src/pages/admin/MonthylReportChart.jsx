import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LabelList
} from 'recharts';

/**
 * Enhanced MonthlyReportChart Component
 * Displays applications and job postings by category
 */
const MonthlyReportChart = ({ data, year, month }) => {
  const [hideEmptyCategories, setHideEmptyCategories] = useState(false);
  
  // Get month name
  const getMonthName = (monthNum) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNum - 1];
  };

  // Transform data for the chart
  const prepareChartData = () => {
    // Ensure data exists and has the expected format
    if (!Array.isArray(data) || data.length === 0) {
      console.warn('Invalid or empty data provided to MonthlyReportChart');
      return [];
    }

    // Check if we have the property names we expect
    const firstItem = data[0];
    const hasExpectedProps = Boolean(
      firstItem && 
      ('categoryName' in firstItem || 'category_name' in firstItem) &&
      ('jobPostingsCount' in firstItem || 'job_postings_count' in firstItem) &&
      ('totalApplications' in firstItem || 'total_applications' in firstItem)
    );

    if (!hasExpectedProps) {
      console.warn('Data does not have expected properties in MonthlyReportChart', firstItem);
    }

    // Sort data by total applications (descending)
    const sortedData = [...data].sort((a, b) => {
      const aApps = a.totalApplications || a.total_applications || 0;
      const bApps = b.totalApplications || b.total_applications || 0;
      return bApps - aApps;
    });
    
    // Filter out categories with no applications if option is selected
    const filteredData = hideEmptyCategories 
      ? sortedData.filter(item => {
          const apps = item.totalApplications || item.total_applications || 0;
          return apps > 0;
        })
      : sortedData;
    
    // Limit to top 10 categories for better visualization
    const limitedData = filteredData.slice(0, 10);
    
    // Format data for chart
    return limitedData.map(category => {
      const name = category.categoryName || category.category_name || 'Unknown';
      const jobs = category.jobPostingsCount || category.job_postings_count || 0;
      const applications = category.totalApplications || category.total_applications || 0;
      const appsPerJob = jobs > 0 ? (applications / jobs).toFixed(2) : '0.00';
      
      return {
        name,
        applications,
        jobs,
        appsPerJob
      };
    });
  };
  
  const chartData = prepareChartData();
  
  // Calculate totals for summary
  const totalApplications = data.reduce((sum, item) => {
    const apps = item.totalApplications || item.total_applications || 0;
    return sum + apps;
  }, 0);
  
  const totalJobs = data.reduce((sum, item) => {
    const jobs = item.jobPostingsCount || item.job_postings_count || 0;
    return sum + jobs;
  }, 0);
  
  const avgAppsPerJob = totalJobs > 0 ? (totalApplications / totalJobs).toFixed(2) : "0.00";

  return (
    <div className="report-chart-container">
      <div className="chart-header">
        <h3 className="chart-title">
          {month ? `${getMonthName(month)} ${year}` : `${year}`} Job Category Report
        </h3>
        <div className="chart-options">
          <label className="filter-option">
            <input 
              type="checkbox" 
              checked={hideEmptyCategories}
              onChange={() => setHideEmptyCategories(!hideEmptyCategories)}
            /> 
            Hide empty categories
          </label>
        </div>
      </div>
      
      {chartData.length === 0 ? (
        <div className="no-chart-data">
          <p>No categories with data to display</p>
        </div>
      ) : (
        <>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80} 
                  tick={{ fontSize: 12 }}
                />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend wrapperStyle={{ paddingTop: 20 }} />
                <Bar 
                  yAxisId="right" 
                  dataKey="applications" 
                  name="Applications" 
                  fill="#82ca9d"
                  radius={[4, 4, 0, 0]}
                >
                  <LabelList dataKey="applications" position="top" />
                </Bar>
                <Bar 
                  yAxisId="left" 
                  dataKey="jobs" 
                  name="Job Postings" 
                  fill="#8884d8"
                  radius={[4, 4, 0, 0]}
                >
                  <LabelList dataKey="jobs" position="top" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="chart-summary">
            <div className="summary-stats">
              <div className="summary-stat">
                <span className="summary-label">Total Job Postings:</span>
                <span className="summary-value">{totalJobs}</span>
              </div>
              <div className="summary-stat">
                <span className="summary-label">Total Applications:</span>
                <span className="summary-value">{totalApplications}</span>
              </div>
              <div className="summary-stat">
                <span className="summary-label">Average Applications per Job:</span>
                <span className="summary-value">{avgAppsPerJob}</span>
              </div>
              {chartData.length > 0 && (
                <div className="summary-stat">
                  <span className="summary-label">Most Popular Category:</span>
                  <span className="summary-value">{chartData[0].name}</span>
                </div>
              )}
            </div>
            
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Jobs</th>
                  <th>Applications</th>
                  <th>Apps/Job</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>{item.jobs}</td>
                    <td>{item.applications}</td>
                    <td>{item.appsPerJob}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default MonthlyReportChart;