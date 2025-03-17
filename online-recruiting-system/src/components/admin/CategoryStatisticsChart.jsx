import React, { useState } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#A4DE6C', '#D0ED57', '#FFC658', '#FF8C00'];

const CategoryStatisticsChart = ({ data, initialChartType = 'pie' }) => {
  const [chartType, setChartType] = useState(initialChartType);
  
  // Ensure data is sorted by application count descending
  const sortedData = [...data].sort((a, b) => b.totalApplications - a.totalApplications);
  
  // For pie chart, we'll limit to top 10 categories
  const topCategories = sortedData.slice(0, 10);
  
  // Calculate total for percentage
  const total = topCategories.reduce((sum, item) => sum + item.totalApplications, 0);
  
  // Format data for pie chart
  const pieData = topCategories.map(category => ({
    name: category.categoryName,
    value: category.totalApplications,
    percentage: ((category.totalApplications / total) * 100).toFixed(2)
  }));

  // Custom tooltip for the pie chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`${payload[0].name}`}</p>
          <p className="tooltip-value">{`Applications: ${payload[0].value}`}</p>
          <p className="tooltip-percentage">{`${payload[0].payload.percentage}%`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="category-statistics-container">
      <h3 className="chart-title">Applications by Category</h3>
      
      <div className="chart-toggle-buttons">
        <button 
          className={`chart-toggle-button ${chartType === 'pie' ? 'active' : ''}`}
          onClick={() => setChartType('pie')}
        >
          Pie Chart
        </button>
        <button 
          className={`chart-toggle-button ${chartType === 'bar' ? 'active' : ''}`}
          onClick={() => setChartType('bar')}
        >
          Bar Chart
        </button>
      </div>
      
      <div className="chart-content">
        {chartType === 'pie' ? (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percentage }) => `${name}: ${percentage}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={topCategories}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="categoryName" 
                angle={-45} 
                textAnchor="end" 
                height={70} 
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalApplications" name="Applications" fill="#8884d8" />
              <Bar dataKey="jobPostingsCount" name="Job Postings" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      
      <div className="category-statistics-table">
        <h4>Category Statistics</h4>
        <table className="statistics-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Job Postings</th>
              <th>Applications</th>
              <th>Avg. Applications per Job</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((category, index) => (
              <tr key={index}>
                <td>{category.categoryName}</td>
                <td>{category.jobPostingsCount}</td>
                <td>{category.totalApplications}</td>
                <td>
                  {(category.totalApplications / Math.max(1, category.jobPostingsCount)).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoryStatisticsChart;