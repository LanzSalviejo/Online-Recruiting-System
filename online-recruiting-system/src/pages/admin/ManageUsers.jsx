import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Search, 
  Filter, 
  ChevronDown, 
  UserPlus, 
  Edit, 
  UserX,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import api from '../../services/api';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'applicants', 'hr', 'admin'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'alphabetical', 'recent'
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // In a real application, you would call your API with the appropriate parameters
        // For this example, we'll simulate the API call with a mock response
        
        // Mock data for demonstration
        setTimeout(() => {
          const mockUsers = [
            {
              id: '1',
              firstName: 'John',
              lastName: 'Smith',
              email: 'john@example.com',
              accountType: 'applicant',
              isActive: true,
              isVerified: true,
              createdAt: '2025-01-15T12:00:00.000Z'
            },
            {
              id: '2',
              firstName: 'Sarah',
              lastName: 'Johnson',
              email: 'sarah@example.com',
              accountType: 'hr',
              isActive: true,
              isVerified: true,
              createdAt: '2025-01-20T12:00:00.000Z'
            },
            {
              id: '3',
              firstName: 'Michael',
              lastName: 'Brown',
              email: 'michael@example.com',
              accountType: 'admin',
              isActive: true,
              isVerified: true,
              createdAt: '2024-12-05T12:00:00.000Z'
            },
            {
              id: '4',
              firstName: 'Emma',
              lastName: 'Davis',
              email: 'emma@example.com',
              accountType: 'applicant',
              isActive: false,
              isVerified: true,
              createdAt: '2024-12-20T12:00:00.000Z'
            },
            {
              id: '5',
              firstName: 'Robert',
              lastName: 'Wilson',
              email: 'robert@example.com',
              accountType: 'hr',
              isActive: true,
              isVerified: false,
              createdAt: '2025-02-01T12:00:00.000Z'
            }
          ];
          
          setUsers(mockUsers);
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  // Filter and sort users
  const getFilteredUsers = () => {
    // First apply account type filter
    let filtered = users.filter(user => {
      if (filter === 'all') return true;
      if (filter === 'applicants') return user.accountType === 'applicant';
      if (filter === 'hr') return user.accountType === 'hr';
      if (filter === 'admin') return user.accountType === 'admin';
      return true;
    });

    // Then apply search filter if there's a search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.firstName.toLowerCase().includes(term) ||
        user.lastName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      );
    }

    // Then apply sorting
    if (sortBy === 'newest') {
      return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'alphabetical') {
      return filtered.sort((a, b) => {
        const nameA = `${a.lastName}, ${a.firstName}`.toLowerCase();
        const nameB = `${b.lastName}, ${b.firstName}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else if (sortBy === 'recent') {
      // In a real application, you might sort by last login date
      // For this example, we'll just use creation date
      return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    return filtered;
  };

  // Handle user activation/deactivation
  const handleActivationToggle = async (userId, currentStatus) => {
    try {
      // In a real application, you would call your API
      // await api.put(`/admin/users/${userId}/toggle-activation`);
      
      // Update the local state
      setUsers(prev => 
        prev.map(user => user.id === userId ? { ...user, isActive: !currentStatus } : user)
      );
    } catch (err) {
      console.error('Error toggling user activation:', err);
      alert('Failed to update user status. Please try again.');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get badge class for account type
  const getAccountTypeBadge = (accountType) => {
    switch (accountType) {
      case 'admin':
        return 'user-badge-admin';
      case 'hr':
        return 'user-badge-hr';
      case 'applicant':
        return 'user-badge-applicant';
      default:
        return 'user-badge-applicant';
    }
  };

  const filteredUsers = getFilteredUsers();

  return (
    <div className="page-container">
      <div className="page-header-with-actions">
        <h1 className="page-title">Manage Users</h1>
        <Link 
          to="/admin/create-user" 
          className="primary-button"
        >
          <UserPlus size={16} />
          Create User
        </Link>
      </div>
      
      {/* Filter and Search */}
      <div className="filter-search-container">
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'filter-tab-active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Users
          </button>
          <button 
            className={`filter-tab ${filter === 'applicants' ? 'filter-tab-active' : ''}`}
            onClick={() => setFilter('applicants')}
          >
            Applicants
          </button>
          <button 
            className={`filter-tab ${filter === 'hr' ? 'filter-tab-active' : ''}`}
            onClick={() => setFilter('hr')}
          >
            HR Staff
          </button>
          <button 
            className={`filter-tab ${filter === 'admin' ? 'filter-tab-active' : ''}`}
            onClick={() => setFilter('admin')}
          >
            Admins
          </button>
        </div>
        
        <div className="search-sort">
          <div className="search-container">
            <div className="search-input-wrapper">
              <Search className="search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name or email..."
                className="search-input"
              />
            </div>
          </div>
          
          <div className="sort-dropdown">
            <button
              className="sort-button"
              onClick={() => setShowSortOptions(!showSortOptions)}
            >
              <span>Sort by: {sortBy === 'newest' ? 'Newest' : sortBy === 'alphabetical' ? 'Alphabetical' : 'Recent Activity'}</span>
              <ChevronDown size={16} />
            </button>
            
            {showSortOptions && (
              <div className="sort-options">
                <button
                  className={`sort-option ${sortBy === 'newest' ? 'sort-option-active' : ''}`}
                  onClick={() => {
                    setSortBy('newest');
                    setShowSortOptions(false);
                  }}
                >
                  Newest
                </button>
                <button
                  className={`sort-option ${sortBy === 'alphabetical' ? 'sort-option-active' : ''}`}
                  onClick={() => {
                    setSortBy('alphabetical');
                    setShowSortOptions(false);
                  }}
                >
                  Alphabetical
                </button>
                <button
                  className={`sort-option ${sortBy === 'recent' ? 'sort-option-active' : ''}`}
                  onClick={() => {
                    setSortBy('recent');
                    setShowSortOptions(false);
                  }}
                >
                  Recent Activity
                </button>
              </div>
            )}
          </div>
          
          <button
            className="filter-toggle-button"
            onClick={() => setShowFilters(!showFilters)}
            aria-label="More filters"
          >
            <Filter size={20} />
          </button>
        </div>
      </div>
      
      {/* Additional filters that can be toggled */}
      {showFilters && (
        <div className="advanced-filters">
          <div className="filter-grid">
            <div className="filter-group">
              <label className="filter-label">Status</label>
              <div className="filter-options">
                <label className="filter-option">
                  <input type="checkbox" /> Active
                </label>
                <label className="filter-option">
                  <input type="checkbox" /> Inactive
                </label>
              </div>
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Verification</label>
              <div className="filter-options">
                <label className="filter-option">
                  <input type="checkbox" /> Verified
                </label>
                <label className="filter-option">
                  <input type="checkbox" /> Unverified
                </label>
              </div>
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Date Range</label>
              <div className="filter-date-range">
                <input 
                  type="date" 
                  className="filter-input" 
                  placeholder="From"
                />
                <span className="filter-date-separator">to</span>
                <input 
                  type="date" 
                  className="filter-input" 
                  placeholder="To"
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Users List */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading users...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          <AlertTriangle size={24} />
          <p>{error}</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="no-data-container">
          <User size={48} className="no-data-icon" />
          <h3 className="no-data-title">No users found</h3>
          <p className="no-data-text">
            {searchTerm 
              ? `No users match your search for "${searchTerm}".` 
              : filter !== 'all' 
                ? `No ${filter} found.` 
                : 'There are no users in the system yet.'}
          </p>
          {(searchTerm || filter !== 'all') && (
            <button
              className="reset-filters-button"
              onClick={() => {
                setSearchTerm('');
                setFilter('all');
              }}
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <div className="users-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className={!user.isActive ? 'inactive-row' : ''}>
                  <td className="user-cell">
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </div>
                      <div>
                        <div className="user-name">{user.firstName} {user.lastName}</div>
                        {!user.isVerified && (
                          <div className="user-verification-tag">Unverified</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="user-email">
                    {user.email}
                  </td>
                  <td>
                    <span className={`user-badge ${getAccountTypeBadge(user.accountType)}`}>
                      {user.accountType.charAt(0).toUpperCase() + user.accountType.slice(1)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-indicator ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    {formatDate(user.createdAt)}
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link
                        to={`/manage-users/${user.id}`}
                        className="action-button action-edit"
                        title="Edit User"
                      >
                        <Edit size={16} />
                      </Link>
                      <button
                        onClick={() => handleActivationToggle(user.id, user.isActive)}
                        className={`action-button ${user.isActive ? 'action-deactivate' : 'action-activate'}`}
                        title={user.isActive ? 'Deactivate User' : 'Activate User'}
                      >
                        {user.isActive ? <UserX size={16} /> : <CheckCircle size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;