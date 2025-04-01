import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  Settings, 
  BarChart2, 
  Shield,
  UserPlus,
  Folder,
  CheckCircle,
  XCircle
} from 'lucide-react';

const AdminDashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeJobs: 0,
    categories: 0,
    pendingApprovals: 0
  });
  
  const [recentUsers, setRecentUsers] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  
  // Fetch admin data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // These would be replaced with actual API calls
        
        // Mock statistics data
        setStats({
          totalUsers: 120,
          activeJobs: 25,
          categories: 12,
          pendingApprovals: 3
        });
        
        // Mock recent users
        setRecentUsers([
          {
            _id: '1',
            name: 'John Smith',
            email: 'john@example.com',
            accountType: 'applicant',
            joinDate: '2025-02-15T00:00:00.000Z',
            status: 'active'
          },
          {
            _id: '2',
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            accountType: 'hr',
            joinDate: '2025-02-14T00:00:00.000Z',
            status: 'active'
          },
          {
            _id: '3',
            name: 'Michael Thompson',
            email: 'michael@example.com',
            accountType: 'applicant',
            joinDate: '2025-02-13T00:00:00.000Z',
            status: 'inactive'
          }
        ]);
        
        // Mock pending approvals
        setPendingApprovals([
          {
            _id: '101',
            name: 'Emily Rogers',
            email: 'emily@company.com',
            accountType: 'hr',
            workingId: 'HR-2025-01',
            requestDate: '2025-02-16T00:00:00.000Z'
          },
          {
            _id: '102',
            name: 'Daniel Wilson',
            email: 'daniel@company.com',
            accountType: 'hr',
            workingId: 'HR-2025-02',
            requestDate: '2025-02-15T00:00:00.000Z'
          },
          {
            _id: '103',
            name: 'Jessica Brown',
            email: 'jessica@company.com',
            accountType: 'hr',
            workingId: 'HR-2025-03',
            requestDate: '2025-02-14T00:00:00.000Z'
          }
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Format date to readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle approve/reject HR account
  const handleApproval = (id, approved) => {
    // application, you would call your API
    console.log(`${approved ? 'Approving' : 'Rejecting'} HR account with ID: ${id}`);
    
    // Update local state to remove the processed approval
    setPendingApprovals(pendingApprovals.filter(approval => approval._id !== id));
    
    // Update the total count
    setStats(prevStats => ({
      ...prevStats,
      pendingApprovals: prevStats.pendingApprovals - 1
    }));
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Admin Dashboard</h2>
        
        <div className="dashboard-actions">
          <Link 
            to="/manage-users" 
            className="dashboard-action-button dashboard-action-primary"
          >
            <Users size={18} className="dashboard-action-icon" />
            Manage Users
          </Link>
          
          <Link 
            to="/categories" 
            className="dashboard-action-button dashboard-action-secondary"
          >
            <Folder size={18} className="dashboard-action-icon" />
            Job Categories
          </Link>
        </div>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card stat-card-blue">
          <div className="stat-icon-container stat-icon-blue">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-title">Total Users</p>
            <p className="stat-value">{stats.totalUsers}</p>
          </div>
        </div>
        
        <div className="stat-card stat-card-green">
          <div className="stat-icon-container stat-icon-green">
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-title">Active Job Posts</p>
            <p className="stat-value">{stats.activeJobs}</p>
          </div>
        </div>
        
        <div className="stat-card stat-card-purple">
          <div className="stat-icon-container stat-icon-purple">
            <Folder size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-title">Job Categories</p>
            <p className="stat-value">{stats.categories}</p>
          </div>
        </div>
        
        <div className="stat-card stat-card-yellow">
          <div className="stat-icon-container stat-icon-yellow">
            <Shield size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-title">Pending Approvals</p>
            <p className="stat-value">{stats.pendingApprovals}</p>
          </div>
        </div>
      </div>
      
      <div className="dashboard-grid">
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h3 className="dashboard-section-title">Recent Users</h3>
            <Link to="/manage-users" className="dashboard-section-link">
              View All
            </Link>
          </div>
          
          <div className="dashboard-section-content">
            {recentUsers.length > 0 ? (
              <div className="dashboard-list">
                {recentUsers.map(user => (
                  <div key={user._id} className="dashboard-list-item">
                    <div className="dashboard-list-item-content">
                      <h4 className="dashboard-list-item-title">{user.name}</h4>
                      <p className="dashboard-list-item-subtitle">{user.email}</p>
                      <div className="dashboard-list-item-meta">
                        <span className="dashboard-list-item-date">Joined: {formatDate(user.joinDate)}</span>
                        <div className="user-badge-container">
                          <span className={`user-badge user-badge-${user.accountType}`}>
                            {user.accountType.charAt(0).toUpperCase() + user.accountType.slice(1)}
                          </span>
                          <span className={`user-status-dot ${
                            user.status === 'active' ? 'user-status-active' : 'user-status-inactive'
                          }`}></span>
                        </div>
                      </div>
                    </div>
                    <Link 
                      to={`/manage-users/${user._id}`}
                      className="dashboard-list-item-action"
                    >
                      Edit
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dashboard-section-empty">
                <Users size={40} className="dashboard-section-empty-icon" />
                <p className="dashboard-section-empty-text">No users found</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h3 className="dashboard-section-title">Pending HR Approvals</h3>
            <Link to="/hr-approvals" className="dashboard-section-link">
              View All
            </Link>
          </div>
          
          <div className="dashboard-section-content">
            {pendingApprovals.length > 0 ? (
              <div className="dashboard-list">
                {pendingApprovals.map(approval => (
                  <div key={approval._id} className="dashboard-list-item">
                    <div className="dashboard-list-item-content">
                      <h4 className="dashboard-list-item-title">{approval.name}</h4>
                      <p className="dashboard-list-item-subtitle">{approval.email}</p>
                      <div className="dashboard-list-item-meta">
                        <span className="dashboard-list-item-date">Request date: {formatDate(approval.requestDate)}</span>
                        <span className="dashboard-list-item-tag">
                          ID: {approval.workingId}
                        </span>
                      </div>
                    </div>
                    <div className="approval-actions">
                      <button 
                        onClick={() => handleApproval(approval._id, true)}
                        className="approval-button approval-approve"
                      >
                        <CheckCircle size={16} className="approval-icon" />
                        Approve
                      </button>
                      <button 
                        onClick={() => handleApproval(approval._id, false)}
                        className="approval-button approval-reject"
                      >
                        <XCircle size={16} className="approval-icon" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dashboard-section-empty">
                <Shield size={40} className="dashboard-section-empty-icon" />
                <p className="dashboard-section-empty-text">No pending approvals</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h3 className="dashboard-section-title">System Reports</h3>
          <Link to="/reports" className="dashboard-section-link">
            View All Reports
          </Link>
        </div>
        
        <div className="report-grid">
          <Link to="/reports/category" className="report-card">
            <div className="report-icon-container report-icon-blue">
              <Folder size={24} />
            </div>
            <div className="report-content">
              <h4 className="report-title">Category Report</h4>
              <p className="report-description">Applications by job category</p>
            </div>
          </Link>
          
          <Link to="/reports/qualification" className="report-card">
            <div className="report-icon-container report-icon-green">
              <BarChart2 size={24} />
            </div>
            <div className="report-content">
              <h4 className="report-title">Qualification Report</h4>
              <p className="report-description">Qualification rates by job</p>
            </div>
          </Link>
          
          <Link to="/reports/user" className="report-card">
            <div className="report-icon-container report-icon-purple">
              <Users size={24} />
            </div>
            <div className="report-content">
              <h4 className="report-title">User Report</h4>
              <p className="report-description">User activity and registrations</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;