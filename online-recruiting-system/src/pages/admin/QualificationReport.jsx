import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import QualificationRateChart from '../../components/admin/QualificationRateChart';
import ReportDateSelector from '../../components/admin/ReportDateSelector';
import api from '../../services/api';

const QualificationReport = () => {
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
          ? `/reports/qualification/monthly/${year}/${month}`
          : `/reports/qualification/yearly/${year}`;
        
        const response = await api.get(endpoint);
        setReportData(response.data.data || []);
        setLoading(false);
      } catch (err) {
        console.error(`Error fetching qualification report:`, err);
        setError(`Failed to load qualification report data. Please try again later.`);
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
      ['Job Title', 'Category', 'Total Applications', 'Qualified Applications', 'Qualification Rate', 'Difficulty Level'],
      // CSV data rows
      ...reportData.map(item => [
        item.jobTitle,
        item.categoryName,
        item.totalApplications,
        item.qualifiedApplications,
        (item.qualificationRate * 100).toFixed(2) + '%',
        item.difficulty
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportType}_qualification_report_${year}${reportType === 'monthly' ? `_${month}` : ''}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="report-page-container">
      <div className="report-page-header">
        <h2 className="report-page-title">Job Qualification Rate Analysis</h2>
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
            Monthly Analysis
          </button>
          <button 
            className={`report-type-button ${reportType === 'yearly' ? 'active' : ''}`}
            onClick={() => handleReportTypeChange('yearly')}
          >
            Yearly Analysis
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
          <p className="loading-text">Loading qualification data...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          {error}
        </div>
      ) : reportData.length === 0 ? (
        <div className="no-data-message">
          <p>No qualification data available for the selected time period.</p>
        </div>
      ) : (
        <div className="report-content">
          <div className="report-section">
            <QualificationRateChart data={reportData} />
          </div>
          
          <div className="report-insights">
            <h3>Analysis Insights</h3>
            <div className="insights-grid">
              <div className="insight-card">
                <h4>Hardest to Fill Positions</h4>
                <p>
                  Jobs with the lowest qualification rates may have overly strict requirements 
                  or may need requirement adjustments to attract more qualified candidates.
                </p>
              </div>
              
              <div className="insight-card">
                <h4>Easiest to Fill Positions</h4>
                <p>
                  Jobs with high qualification rates may indicate well-aligned job descriptions
                  and candidate pools or potentially underspecified requirements.
                </p>
              </div>
              
              <div className="insight-card">
                <h4>Recommendations</h4>
                <p>
                  Consider reviewing requirements for positions with qualification rates below 25% 
                  to improve candidate matching and reduce screening workload.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualificationReport;