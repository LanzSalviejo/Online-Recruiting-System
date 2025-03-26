import React, { useState, useEffect } from 'react';
import { 
  BarChart,
  Bar,
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList
} from 'recharts';

/**
 * CategoryStatisticsChart Component
 * Displays category statistics using a bar chart
 */
const CategoryStatisticsChart = ({ data }) => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    // Normalize data for chart
    const prepareChartData = () => {
      if (!Array.isArray(data) || data.length === 0) {
        return [];
      }
      
      // Transform data to handle both property naming conventions
      const transformed = data.map(item => {
        const name = item.categoryName || item.category_name || 'Unknown';
        const value = Number(item.totalApplications || item.total_applications || 0);
        const jobs = Number(item.jobPostingsCount || item.job_postings_count || 0);
        
        return { name, value, jobs };
      })
      .filter(item => item.value > 0 || item.jobs > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Limit to top 8 for better visualization
      
      return transformed;
    };
    
    setChartData(prepareChartData());
  }, [data]);
  
  return (
    <div className="category-statistics-chart">
      <div className="chart-header">
        <h3>Applications by Category</h3>
      </div>
      
      {chartData.length === 0 ? (
        <div className="no-chart-data">
          <p>No application data available to display</p>
        </div>
      ) : (
        <div className="chart-content">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Applications" fill="#82ca9d">
                <LabelList dataKey="value" position="right" />
              </Bar>
              <Bar dataKey="jobs" name="Job Postings" fill="#8884d8">
                <LabelList dataKey="jobs" position="right" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {chartData.length > 0 && (
        <div className="category-statistics-table">
          <h4>Category Statistics</h4>
          <table className="stats-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Job Postings</th>
                <th>Applications</th>
                <th>Avg. Applications per Job</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>{item.jobs}</td>
                  <td>{item.value}</td>
                  <td>{item.jobs > 0 ? (item.value / item.jobs).toFixed(2) : "0.00"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CategoryStatisticsChart;