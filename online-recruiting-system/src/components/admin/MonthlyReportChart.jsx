import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const MonthlyReportChart = ({ data, year, month }) => {
  // Transform data for the chart if necessary
  const chartData = data.map(category => ({
    name: category.categoryName,
    jobs: category.jobPostingsCount,
    applications: category.totalApplications,
  }));

  // Function to get month name from number
  const getMonthName = (monthNum) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    // If month is a string that starts with a number (like "03"), parse it
    if (typeof monthNum === 'string' && monthNum.match(/^\d+/)) {
      const parsed = parseInt(monthNum, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 12) {
        return months[parsed - 1];
      }
    }
    
    // If month is already a number between 1-12
    if (typeof monthNum === 'number' && monthNum >= 1 && monthNum <= 12) {
      return months[monthNum - 1];
    }
    
    // If it's already a month name or invalid, return as is
    return monthNum;
  };

  // Format the title with the full month name
  const formattedMonth = month ? getMonthName(month) : null;
  
  return (
    <div className="report-chart-container">
      <h3 className="chart-title">
        {formattedMonth ? `${formattedMonth} ${year}` : `${year}`} Job Category Report
      </h3>
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
              height={70} 
            />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="jobs" name="Job Postings" fill="#8884d8" />
            <Bar yAxisId="right" dataKey="applications" name="Applications" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-summary">
        <p>Total Job Postings: {chartData.reduce((sum, item) => sum + item.jobs, 0)}</p>
        <p>Total Applications: {chartData.reduce((sum, item) => sum + item.applications, 0)}</p>
        <p>Average Applications per Job: {
          (chartData.reduce((sum, item) => sum + item.applications, 0) / 
           Math.max(1, chartData.reduce((sum, item) => sum + item.jobs, 0))).toFixed(2)
        }</p>
      </div>
    </div>
  );
};

export default MonthlyReportChart;