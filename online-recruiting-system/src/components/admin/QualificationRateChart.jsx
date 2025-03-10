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
  Cell,
  LabelList
} from 'recharts';

const QualificationRateChart = ({ data }) => {
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  
  // Sort data by qualification rate
  const sortedData = [...data].sort((a, b) => {
    return sortOrder === 'asc' 
      ? a.qualificationRate - b.qualificationRate
      : b.qualificationRate - a.qualificationRate;
  });
  
  // Limit to top/bottom 15 jobs for readability
  const displayData = sortedData.slice(0, 15);
  
  // Calculate overall average qualification rate
  const averageRate = data.reduce((sum, job) => sum + job.qualificationRate, 0) / data.length;
  
  // Function to determine color based on qualification rate
  const getBarColor = (rate) => {
    if (rate < 0.25) return '#FF5252'; // Red for low rates
    if (rate < 0.50) return '#FFD740'; // Yellow for medium rates
    return '#4CAF50'; // Green for high rates
  };

  return (
    <div className="qualification-rate-container">
      <h3 className="chart-title">Job Qualification Rate Analysis</h3>
      
      <div className="chart-controls">
        <button 
          className={`sort-button ${sortOrder === 'asc' ? 'active' : ''}`}
          onClick={() => setSortOrder('asc')}
        >
          Show Hardest to Fill Jobs
        </button>
        <button 
          className={`sort-button ${sortOrder === 'desc' ? 'active' : ''}`}
          onClick={() => setSortOrder('desc')}
        >
          Show Easiest to Fill Jobs
        </button>
      </div>
      
      <div className="rate-summary">
        <p className="average-rate">
          Overall Average Qualification Rate: <strong>{(averageRate * 100).toFixed(2)}%</strong>
        </p>
      </div>
      
      <div className="chart-content">
        <ResponsiveContainer width="100%" height={500}>
          <BarChart
            data={displayData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 150, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis 
              type="number" 
              domain={[0, 1]} 
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} 
            />
            <YAxis 
              dataKey="jobTitle" 
              type="category"
              width={140}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value) => [`${(value * 100).toFixed(2)}%`, 'Qualification Rate']} 
              labelFormatter={(value) => `Job: ${value}`}
            />
            <Legend />
            <Bar dataKey="qualificationRate" name="Qualification Rate" fill="#8884d8">
              {displayData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.qualificationRate)} />
              ))}
              <LabelList dataKey="qualificationRate" position="right" formatter={(value) => `${(value * 100).toFixed(0)}%`} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="qualification-rate-table">
        <h4>Job Qualification Details</h4>
        <table className="statistics-table">
          <thead>
            <tr>
              <th>Job Title</th>
              <th>Category</th>
              <th>Total Applications</th>
              <th>Qualified Applications</th>
              <th>Qualification Rate</th>
              <th>Difficulty Level</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((job, index) => (
              <tr key={index}>
                <td>{job.jobTitle}</td>
                <td>{job.categoryName}</td>
                <td>{job.totalApplications}</td>
                <td>{job.qualifiedApplications}</td>
                <td>{(job.qualificationRate * 100).toFixed(2)}%</td>
                <td className={`difficulty-${job.difficulty.toLowerCase().replace(' ', '-')}`}>
                  {job.difficulty}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QualificationRateChart;