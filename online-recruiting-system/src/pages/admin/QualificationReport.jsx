import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import QualificationRateChart from '../../components/admin/QualificationRateChart';
import ReportDateSelector from '../../components/admin/ReportDateSelector';
import { 
  ArrowLeft, 
  Download, 
  AlertTriangle,
  BarChart2,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import api from '../../services/api';

const QualificationReport = () => {
  const [reportType, setReportType] = useState('monthly'); // 'monthly' or 'yearly'
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [averageRate, setAverageRate] = useState(0);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let response;
        if (reportType === 'monthly') {
          response = await api.get(`/reports/qualification/monthly/${year}/${month}`);
        } else {
          response = await api.get(`/reports/qualification/yearly/${year}`);
        }
        
        if (response.data && response.data.success) {
          // Transform the data to match expected format
          const transformedData = response.data.data.map(item => ({
            jobId: item.job_id,
            jobTitle: item.job_title,
            categoryId: item.category_id,
            categoryName: item.category_name,
            totalApplications: parseInt(item.total_applications) || 0,
            qualifiedApplications: parseInt(item.qualified_applications) || 0,
            qualificationRate: parseFloat(item.qualification_rate) || 0,
            difficulty: item.difficulty
          }));
          
          setReportData(transformedData);
          
          // Calculate average qualification rate
          if (transformedData.length > 0) {
            const sum = transformedData.reduce((total, job) => total + job.qualificationRate, 0);
            setAverageRate(sum / transformedData.length);
          }
        } else {
          throw new Error('Unexpected API response format');
        }
        
        setLoading(false);
      } catch (err) {
        console.error(`Error fetching qualification report:`, err);
        
        // Handle error but provide mock data for demonstration
        const mockData = [
          {
            jobId: 1,
            jobTitle: 'Senior Software Developer',
            categoryId: 1,
            categoryName: 'Information Technology',
            totalApplications: 45,
            qualifiedApplications: 8,
            qualificationRate: 0.18,
            difficulty: 'Hard'
          },
          {
            jobId: 2,
            jobTitle: 'Financial Analyst',
            categoryId: 2,
            categoryName: 'Finance',
            totalApplications: 32,
            qualifiedApplications: 12,
            qualificationRate: 0.38,
            difficulty: 'Moderate'
          },
          {
            jobId: 3,
            jobTitle: 'Marketing Manager',
            categoryId: 3,
            categoryName: 'Marketing',
            totalApplications: 28,
            qualifiedApplications: 15,
            qualificationRate: 0.54,
            difficulty: 'Easy'
          },
          {
            jobId: 4,
            jobTitle: 'HR Coordinator',
            categoryId: 4,
            categoryName: 'Human Resources',
            totalApplications: 18,
            qualifiedApplications: 10,
            qualificationRate: 0.56,
            difficulty: 'Easy'
          },
          {
            jobId: 5,
            jobTitle: 'Sales Representative',
            categoryId: 5,
            categoryName: 'Sales',
            totalApplications: 25,
            qualifiedApplications: 18,
            qualificationRate: 0.72,
            difficulty: 'Very Easy'
          }
        ];
        
        setReportData(mockData);
        
        // Calculate average for mock data
        const sum = mockData.reduce((total, job) => total + job.qualificationRate, 0);
        setAverageRate(sum / mockData.length);
        
        setError(`Failed to load ${reportType} qualification report data from server. Showing sample data.`);
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
    // Get month name for the filename
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = months[month - 1];

    // Create CSV content
    const csvContent = [
      // CSV headers
      ['Job Title', 'Category', 'Total Applications', 'Qualified Applications', 'Qualification Rate', 'Difficulty Level'],
      // CSV data rows
      ...reportData.map(item => [
        item.jobTitle,
        item.categoryName,
        item.totalApplications,
        item.qualifiedApplications,
        `${(item.qualificationRate * 100).toFixed(2)}%`,
        item.difficulty
      ])
    ].map(row => row.join(',')).join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Set filename based on report type
    const filename = reportType === 'monthly'
      ? `qualification_report_${year}_${monthName}.csv`
      : `qualification_report_${year}.csv`;
      
    link.setAttribute('download', filename);
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
            <ArrowLeft size={16} />
            Back to Reports
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
          years={[2025, 2024, 2023]}
        />
        
        <button 
          className="export-button"
          onClick={handleExportCSV}
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>
      
      {error && (
        <div className="warning-message">
          <AlertTriangle size={20} />
          <p>{error}</p>
        </div>
      )}
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading qualification data...</p>
        </div>
      ) : reportData.length === 0 ? (
        <div className="no-data-message">
          <BarChart2 size={48} />
          <p>No qualification data available for the selected time period.</p>
        </div>
      ) : (
        <div className="report-content">
          <div className="rate-summary">
            <h3 className="average-rate-title">
              Overall Average Qualification Rate: 
              <span className="average-rate-value">
                {(averageRate * 100).toFixed(2)}%
              </span>
            </h3>
          </div>
          
          <div className="report-section">
            <QualificationRateChart data={reportData} />
          </div>
          
          <div className="report-insights">
            <h3 className="insights-title">Analysis Insights</h3>
            <div className="insights-grid">
              <div className="insight-card">
                <div className="insight-header">
                  <TrendingDown size={20} className="insight-icon insight-icon-red" />
                  <h4 className="insight-title">Hardest to Fill Positions</h4>
                </div>
                <p className="insight-text">
                  Jobs with the lowest qualification rates may have overly strict requirements 
                  or may need requirement adjustments to attract more qualified candidates.
                </p>
                <div className="insight-examples">
                  {reportData.slice(0, 2).map(job => (
                    <div key={job.jobId} className="insight-example">
                      <strong>{job.jobTitle}</strong> ({(job.qualificationRate * 100).toFixed(0)}%)
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="insight-card">
                <div className="insight-header">
                  <TrendingUp size={20} className="insight-icon insight-icon-green" />
                  <h4 className="insight-title">Easiest to Fill Positions</h4>
                </div>
                <p className="insight-text">
                  Jobs with high qualification rates may indicate well-aligned job descriptions
                  and candidate pools or potentially underspecified requirements.
                </p>
                <div className="insight-examples">
                  {[...reportData].sort((a, b) => b.qualificationRate - a.qualificationRate).slice(0, 2).map(job => (
                    <div key={job.jobId} className="insight-example">
                      <strong>{job.jobTitle}</strong> ({(job.qualificationRate * 100).toFixed(0)}%)
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="insight-card insight-card-full">
                <div className="insight-header">
                  <BarChart2 size={20} className="insight-icon insight-icon-blue" />
                  <h4 className="insight-title">Recommendations</h4>
                </div>
                <ul className="insight-recommendations">
                  <li>Consider reviewing requirements for positions with qualification rates below 25% 
                  to improve candidate matching and reduce screening workload.</li>
                  <li>For positions with very high qualification rates (above 75%), assess if requirements 
                  are sufficiently selective to ensure quality candidates.</li>
                  <li>Compare qualification rates across different job categories to identify patterns 
                  and optimize recruiting strategies by department.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualificationReport;