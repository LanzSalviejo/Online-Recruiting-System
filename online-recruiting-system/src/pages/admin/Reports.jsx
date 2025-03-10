import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart2, PieChart, TrendingUp, Calendar, FileText, Download } from 'lucide-react';

const Reports = () => {
  return (
    <div className="page-container">
      <h1 className="page-title">Administrative Reports</h1>
      
      <div className="reports-grid">
        <Link to="/reports/category" className="report-card">
          <div className="report-card-icon">
            <PieChart size={32} />
          </div>
          <div className="report-card-content">
            <h3 className="report-card-title">Category-Based Applications</h3>
            <p className="report-card-description">
              View application distribution across job categories and analyze category performance
            </p>
          </div>
        </Link>
        
        <Link to="/reports/qualification" className="report-card">
          <div className="report-card-icon">
            <BarChart2 size={32} />
          </div>
          <div className="report-card-content">
            <h3 className="report-card-title">Qualification Rate Analysis</h3>
            <p className="report-card-description">
              Analyze job qualification rates to identify hard-to-fill positions and optimize requirements
            </p>
          </div>
        </Link>
        
        <Link to="/reports/trends" className="report-card">
          <div className="report-card-icon">
            <TrendingUp size={32} />
          </div>
          <div className="report-card-content">
            <h3 className="report-card-title">Recruitment Trends</h3>
            <p className="report-card-description">
              Track application trends over time and identify seasonal patterns
            </p>
          </div>
        </Link>
        
        <Link to="/reports/activity" className="report-card">
          <div className="report-card-icon">
            <Calendar size={32} />
          </div>
          <div className="report-card-content">
            <h3 className="report-card-title">Monthly Activity Report</h3>
            <p className="report-card-description">
              View monthly summaries of job postings, applications, and hiring metrics
            </p>
          </div>
        </Link>
      </div>
      
      <div className="report-actions">
        <h2 className="section-title">Report Actions</h2>
        
        <div className="action-buttons">
          <button className="action-button">
            <FileText size={18} />
            <span>Generate Complete Report</span>
          </button>
          
          <button className="action-button">
            <Download size={18} />
            <span>Export All Data</span>
          </button>
        </div>
      </div>
      
      <div className="report-schedule">
        <h2 className="section-title">Scheduled Reports</h2>
        
        <table className="schedule-table">
          <thead>
            <tr>
              <th>Report Name</th>
              <th>Frequency</th>
              <th>Recipients</th>
              <th>Next Delivery</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Monthly Category Report</td>
              <td>Monthly (1st)</td>
              <td>HR Managers</td>
              <td>{new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString()}</td>
              <td>
                <button className="table-action-button">Edit</button>
              </td>
            </tr>
            <tr>
              <td>Quarterly Qualification Analysis</td>
              <td>Quarterly</td>
              <td>Executive Team</td>
              <td>{new Date(new Date().getFullYear(), Math.floor((new Date().getMonth() + 3) / 3) * 3, 1).toLocaleDateString()}</td>
              <td>
                <button className="table-action-button">Edit</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;