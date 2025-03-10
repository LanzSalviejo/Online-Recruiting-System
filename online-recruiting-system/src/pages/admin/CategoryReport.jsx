import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MonthlyReportChart from '../../components/admin/MonthlyReportChart';
import CategoryStatisticsChart from '../../components/admin/CategoryStatisticsChart';
import ReportDateSelector from '../../components/admin/ReportDateSelector';
import api from '../../services/api';

const CategoryReport = () => {
  const [reportType, setReportType] = useState('monthly'); // 'monthly' or 'yearly'
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const endpoint = reportType === 'monthly' 
          ? `/reports/category/monthly/${year}/${month}`
          : `/reports/category/yearly/${year}`;
        
        const response = await api.get(endpoint);
        setReportData(response.data.data || []);
        setLoading(false);
      } catch (err) {
        console.error(`Error fetching ${reportType} report:`, err);
        setError(`Failed to load ${reportType} report data. Please try again later.`);
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [reportType, year, month]);

  const handleDateChange = (newYear, newMonth) => {
    setYear(newYear);
    if (reportType === 'monthly' && newMonth) {
      setMonth(newMonth);
    }
  };

  const handleReportTypeChange = (type) => {
    setReportType(type);
  };

  const handleExportCSV = () => {
    // Implementation for exporting report data as CSV
    const csvContent = [
      // CSV headers
      ['Category', 'Job Postings', 'Applications', 'Applications per Job'],
      // CSV data rows
      ...reportData.map(item => [
        item.categoryName,
        item.jobPostingsCount,
        item.totalApplications,
        (item.totalApplications / Math.max(1, item.jobPostingsCount)).toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportType}_category_report_${year}${reportType === 'monthly' ? `_${month}` : ''}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="report-page-container">
      <div className="report-page-header">
        <h2 className="report-page-title">Category-based Application Report</h2>
        <div className="report-navigation">
          <Link to="/reports" className="report-nav-link">
            ← Back to Reports
          </Link>
        </div>
      </div>
      
      <div className="report-controls">
        <div className="report-type-selector">
          <button 
            className={`report-type-button ${reportType === 'monthly' ? 'active' : ''}`}
            onClick={() => handleReportTypeChange('monthly')}
          >
            Monthly Report
          </button>
          <button 
            className={`report-type-button ${reportType === 'yearly' ? 'active' : ''}`}
            onClick={() => handleReportTypeChange('yearly')}
          >
            Yearly Report
          </button>
        </div>
        
        <ReportDateSelector 
          onDateChange={handleDateChange} 
          reportType={reportType}
        />
        
        <button 
          className="export-button"
          onClick={handleExportCSV}
        >
          Export CSV
        </button>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading report data...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          {error}
        </div>
      ) : reportData.length === 0 ? (
        <div className="no-data-message">
          <p>No data available for the selected time period.</p>
        </div>
      ) : (
        <div className="report-content">
          <MonthlyReportChart 
            data={reportData}
            year={year}
            month={reportType === 'monthly' ? month : null}
          />
          
          <div className="report-section">
            <CategoryStatisticsChart data={reportData} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryReport;