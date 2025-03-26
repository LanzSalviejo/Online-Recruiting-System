import React from 'react';
import { 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const CategoryStatisticsChart = ({ data }) => {
  // Ensure data is sorted by application count descending
  const sortedData = [...data].sort((a, b) => {
    const aApps = a.totalApplications || 0;
    const bApps = b.totalApplications || 0;
    return bApps - aApps;
  });
  
  // For visualization, we'll limit to top 10 categories
  const topCategories = sortedData.slice(0, 10);

  return (
    <div className="category-statistics-container">
      <h3 className="chart-title">Applications by Category</h3>
      
      <div className="chart-content">
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
            <Bar dataKey="totalApplications" name="Applications" fill="#82ca9d" />
            <Bar dataKey="jobPostingsCount" name="Job Postings" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
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
                <td>{category.jobPostingsCount || 0}</td>
                <td>{category.totalApplications || 0}</td>
                <td>
                  {((category.totalApplications || 0) / Math.max(1, (category.jobPostingsCount || 0))).toFixed(2)}
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