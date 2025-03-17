import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MonthlyReportChart from '../../components/admin/MonthlyReportChart';
import CategoryStatisticsChart from '../../components/admin/CategoryStatisticsChart';
import ReportDateSelector from '../../components/admin/ReportDateSelector';
import { 
  BarChart2, 
  Download, 
  AlertTriangle, 
  ArrowLeft 
} from 'lucide-react';
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
        
        let response;
        if (reportType === 'monthly') {
          response = await api.get(`/reports/category/monthly/${year}/${month}`);
        } else {
          response = await api.get(`/reports/category/yearly/${year}`);
        }
        
        if (response.data && response.data.success) {
          // Transform the data to match the expected format for our components
          const formattedData = (response.data.data || []).map(item => ({
            categoryId: item.category_id,
            categoryName: item.category_name,
            jobPostingsCount: item.job_postings_count,
            totalApplications: item.total_applications
          }));
          setReportData(formattedData);
        } else {
          throw new Error('Unexpected API response format');
        }
        
        setLoading(false);
      } catch (err) {
        console.error(`Error fetching ${reportType} report:`, err);
        
        // Handle error but provide mock data for demonstration
        const mockData = [
          { 
            category_id: 1, 
            category_name: 'Information Technology', 
            job_postings_count: 15, 
            total_applications: 128 
          },
          { 
            category_id: 2, 
            category_name: 'Finance', 
            job_postings_count: 8, 
            total_applications: 76 
          },
          { 
            category_id: 3, 
            category_name: 'Marketing', 
            job_postings_count: 10, 
            total_applications: 65 
          },
          { 
            category_id: 4, 
            category_name: 'Human Resources', 
            job_postings_count: 5, 
            total_applications: 43 
          },
          { 
            category_id: 5, 
            category_name: 'Sales', 
            job_postings_count: 7, 
            total_applications: 38 
          }
        ];
        
        // Transform mock data to match expected format
        const formattedData = mockData.map(item => ({
          categoryId: item.category_id,
          categoryName: item.category_name,
          jobPostingsCount: item.job_postings_count,
          totalApplications: item.total_applications
        }));
        
        setReportData(formattedData);
        setError(`Failed to load ${reportType} report data from server. Showing sample data.`);
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
      ['Category', 'Job Postings', 'Applications', 'Applications per Job'],
      // CSV data rows
      ...reportData.map(item => [
        item.categoryName,
        item.jobPostingsCount || 0,
        item.totalApplications || 0,
        item.jobPostingsCount 
          ? ((item.totalApplications || 0) / item.jobPostingsCount).toFixed(2) 
          : "0.00"
      ])
    ].map(row => row.join(',')).join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Set filename based on report type
    const filename = reportType === 'monthly'
      ? `category_report_${year}_${monthName}.csv`
      : `category_report_${year}.csv`;
      
    link.setAttribute('download', filename);
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
          <p className="loading-text">Loading report data...</p>
        </div>
      ) : reportData.length === 0 ? (
        <div className="no-data-message">
          <BarChart2 size={48} />
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
          
          <div className="report-summary">
            <h3 className="report-summary-title">Report Summary</h3>
            <div className="summary-cards">
              <div className="summary-card">
                <div className="summary-card-title">Total Job Postings</div>
                <div className="summary-card-value">
                  {reportData.reduce((sum, item) => sum + (item.jobPostingsCount || 0), 0)}
                </div>
              </div>
              
              <div className="summary-card">
                <div className="summary-card-title">Total Applications</div>
                <div className="summary-card-value">
                  {reportData.reduce((sum, item) => sum + (item.totalApplications || 0), 0)}
                </div>
              </div>
              
              <div className="summary-card">
                <div className="summary-card-title">Most Popular Category</div>
                <div className="summary-card-value">
                  {reportData.length > 0 ? reportData[0].categoryName : 'N/A'}
                </div>
              </div>
              
              <div className="summary-card">
                <div className="summary-card-title">Average Applications per Job</div>
                <div className="summary-card-value">
                  {(() => {
                    const totalJobs = reportData.reduce((sum, item) => sum + (item.jobPostingsCount || 0), 0);
                    const totalApps = reportData.reduce((sum, item) => sum + (item.totalApplications || 0), 0);
                    return totalJobs > 0 ? (totalApps / totalJobs).toFixed(2) : "0.00";
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryReport;