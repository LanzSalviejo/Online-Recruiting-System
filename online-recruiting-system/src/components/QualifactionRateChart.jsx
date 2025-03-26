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
  const [displayCount, setDisplayCount] = useState(10); // Number of jobs to display
  
  // Sort data by qualification rate
  const sortedData = [...data].sort((a, b) => {
    return sortOrder === 'asc' 
      ? a.qualificationRate - b.qualificationRate
      : b.qualificationRate - a.qualificationRate;
  });
  
  // Limit to top/bottom N jobs for readability
  const displayData = sortedData.slice(0, displayCount);
  
  // Calculate overall average qualification rate
  const averageRate = data.reduce((sum, job) => sum + job.qualificationRate, 0) / Math.max(1, data.length);
  
  // Function to determine color based on qualification rate
  const getBarColor = (rate) => {
    if (rate < 0.10) return '#EF4444'; // Red for very low rates (Very Hard)
    if (rate < 0.25) return '#F97316'; // Orange for low rates (Hard)
    if (rate < 0.50) return '#FBBF24'; // Yellow for medium rates (Moderate)
    if (rate < 0.75) return '#34D399'; // Light green for higher rates (Easy)
    return '#10B981'; // Green for high rates (Very Easy)
  };
  
  // Custom tooltip to show more details
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const job = payload[0].payload;
      
      return (
        <div className="qualification-tooltip">
          <div className="tooltip-title">{job.jobTitle}</div>
          <div className="tooltip-category">{job.categoryName}</div>
          <div className="tooltip-row">
            <span className="tooltip-label">Qualification Rate:</span>
            <span className="tooltip-value">{(job.qualificationRate * 100).toFixed(2)}%</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">Total Applications:</span>
            <span className="tooltip-value">{job.totalApplications}</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">Qualified Candidates:</span>
            <span className="tooltip-value">{job.qualifiedApplications}</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">Difficulty Level:</span>
            <span className="tooltip-value">{job.difficulty}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Format text for Axis labels
  const formatPercent = (value) => `${(value * 100).toFixed(0)}%`;
  
  // Truncate job titles for display
  const truncateText = (text, maxLength = 25) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <div className="qualification-rate-container">
      <div className="chart-controls">
        <div className="control-group">
          <label className="control-label">Sort by:</label>
          <div className="button-group">
            <button 
              className={`sort-button ${sortOrder === 'asc' ? 'active' : ''}`}
              onClick={() => setSortOrder('asc')}
            >
              Hardest to Easiest
            </button>
            <button 
              className={`sort-button ${sortOrder === 'desc' ? 'active' : ''}`}
              onClick={() => setSortOrder('desc')}
            >
              Easiest to Hardest
            </button>
          </div>
        </div>
        
        <div className="control-group">
          <label className="control-label">Display:</label>
          <select 
            className="display-select"
            value={displayCount}
            onChange={(e) => setDisplayCount(Number(e.target.value))}
          >
            <option value={5}>Top 5</option>
            <option value={10}>Top 10</option>
            <option value={15}>Top 15</option>
            <option value={20}>Top 20</option>
            {data.length > 20 && <option value={data.length}>All ({data.length})</option>}
          </select>
        </div>
      </div>
      
      <div className="chart-content">
        <ResponsiveContainer width="100%" height={500}>
          <BarChart
            data={displayData}
            layout="vertical"
            margin={{ top: 20, right: 120, left: 150, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis 
              type="number" 
              domain={[0, 1]} 
              tickFormatter={formatPercent} 
            />
            <YAxis 
              dataKey="jobTitle" 
              type="category"
              width={140}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => truncateText(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="qualificationRate" 
              name="Qualification Rate" 
              fill="#8884d8"
              radius={[0, 4, 4, 0]}
            >
              {displayData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.qualificationRate)} />
              ))}
              <LabelList 
                dataKey="qualificationRate" 
                position="right" 
                formatter={formatPercent} 
                style={{ fontWeight: 'bold' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="qualification-rate-table">
        <h4 className="table-title">Job Qualification Details</h4>
        <div className="table-container">
          <table className="statistics-table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Category</th>
                <th>Total Applications</th>
                <th>Qualified Candidates</th>
                <th>Qualification Rate</th>
                <th>Difficulty Level</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((job, index) => (
                <tr key={index} className={`difficulty-row-${job.difficulty.toLowerCase().replace(' ', '-')}`}>
                  <td>{job.jobTitle}</td>
                  <td>{job.categoryName}</td>
                  <td>{job.totalApplications}</td>
                  <td>{job.qualifiedApplications}</td>
                  <td className="qualification-rate-cell">
                    {(job.qualificationRate * 100).toFixed(2)}%
                  </td>
                  <td className={`difficulty-${job.difficulty.toLowerCase().replace(' ', '-')}`}>
                    {job.difficulty}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QualificationRateChart;