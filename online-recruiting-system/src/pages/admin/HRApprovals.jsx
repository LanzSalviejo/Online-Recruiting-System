import React, { useState, useEffect } from 'react';
import { Users, Shield, CheckCircle, XCircle, AlertTriangle, Eye } from 'lucide-react';
import api from '../../services/api';

// Mock data for demonstration and testing - moved outside the component to be reusable
const MOCK_APPROVALS = [
  {
    id: '101',
    firstName: 'Emily',
    lastName: 'Rogers',
    email: 'emily@company.com',
    workingId: 'HR-2025-01',
    companyName: 'Tech Solutions Inc.',
    phoneNumber: '555-123-4567',
    createdAt: '2025-02-16T00:00:00.000Z'
  },
  {
    id: '102',
    firstName: 'Daniel',
    lastName: 'Wilson',
    email: 'daniel@company.com',
    workingId: 'HR-2025-02',
    companyName: 'Global Innovations Ltd.',
    phoneNumber: '555-987-6543',
    createdAt: '2025-02-15T00:00:00.000Z'
  },
  {
    id: '103',
    firstName: 'Jessica',
    lastName: 'Brown',
    email: 'jessica@company.com',
    workingId: 'HR-2025-03',
    companyName: 'Creative Minds Corp.',
    phoneNumber: '555-567-8901',
    createdAt: '2025-02-14T00:00:00.000Z'
  }
];

const HRApprovals = () => {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      try {
        // Attempt to fetch actual pending HR approvals from the API
        // Make sure the path matches your server route exactly
        const response = await api.get('admin/hr-approvals', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        // If we get here, we've successfully fetched real data
        console.log('API call successful:', response.data);
        
        // Use real data if available, otherwise use mock data
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          // Create a combined list, prioritizing real data
          // Use a Map with ID as key to avoid duplicates in case a mock ID matches a real one
          const approvalMap = new Map();
          
          // Add real approvals to the map
          response.data.forEach(approval => {
            approvalMap.set(approval.id, approval);
          });
          
          // Add mock approvals if they don't conflict with real ones
          MOCK_APPROVALS.forEach(mockApproval => {
            // Only add mock if there's no real approval with the same ID
            if (!approvalMap.has(mockApproval.id)) {
              approvalMap.set(mockApproval.id, {
                ...mockApproval,
                isMock: true // Add a flag to identify mock data
              });
            }
          });
          
          // Convert map back to array
          const combinedApprovals = Array.from(approvalMap.values());
          setPendingApprovals(combinedApprovals);
        } else {
          // If the response has no data, use mock data
          setPendingApprovals(MOCK_APPROVALS.map(approval => ({...approval, isMock: true})));
        }
      } catch (apiErr) {
        console.warn('Could not fetch real approvals, using mock data only:', apiErr);
        setPendingApprovals(MOCK_APPROVALS.map(approval => ({...approval, isMock: true})));
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error in fetchPendingApprovals:', err);
      setError('Failed to load pending HR approval requests. Please try again.');
      setLoading(false);
      // Still set mock data so the UI isn't empty
      setPendingApprovals(MOCK_APPROVALS.map(approval => ({...approval, isMock: true})));
    }
  };

  const handleApproval = async (id, approved) => {
    try {
      setProcessing(true);
      const approvalToHandle = pendingApprovals.find(a => a.id === id);
      
      if (approvalToHandle?.isMock) {
        // For mock data, just update the local state without an API call
        console.log(`Mock approval: ${approved ? 'Approving' : 'Rejecting'} HR staff with ID: ${id}`);
        
        // Add a small delay to simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        // For real data, make the API call
        // Make sure the path matches your server route exactly
        console.log(`Making API call to approve/reject HR staff with ID: ${id}`);
        await api.put(`admin/hr-approvals/${id}`, { approved }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      }
      
      // Update local state for both real and mock data
      setPendingApprovals(pendingApprovals.filter(approval => approval.id !== id));
      setShowModal(false);
      setSelectedApproval(null);
      setProcessing(false);
    } catch (err) {
      console.error(`Error ${approved ? 'approving' : 'rejecting'} HR staff:`, err);
      setError(`Failed to ${approved ? 'approve' : 'reject'} HR staff. Please try again.`);
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const viewDetails = (approval) => {
    setSelectedApproval(approval);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading pending HR approvals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header-with-actions">
        <h1 className="page-title">HR Staff Approval Requests</h1>
        <button 
          onClick={fetchPendingApprovals}
          className="refresh-button"
          disabled={loading}
          title="Refresh approval requests"
        >
          Refresh
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          <AlertTriangle size={20} />
          <p>{error}</p>
          <button 
            onClick={() => setError(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#b91c1c',
              cursor: 'pointer',
              marginLeft: 'auto'
            }}
          >
            <XCircle size={16} />
          </button>
        </div>
      )}
      
      {pendingApprovals.length === 0 ? (
        <div className="no-data-container">
          <Shield size={48} className="no-data-icon" />
          <h3 className="no-data-title">No Pending Approval Requests</h3>
          <p className="no-data-text">
            There are currently no pending HR staff approval requests.
          </p>
        </div>
      ) : (
        <div className="users-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Working ID</th>
                <th>Request Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingApprovals.map(approval => (
                <tr key={approval.id}>
                  <td className="user-cell">
                    <div className="user-info">
                      <div className="user-avatar">
                        {approval.firstName.charAt(0)}{approval.lastName.charAt(0)}
                      </div>
                      <div>
                        <div className="user-name">
                          {approval.firstName} {approval.lastName}
                          {approval.isMock && (
                            <span style={{ 
                              fontSize: '0.7rem', 
                              backgroundColor: '#e5e7eb', 
                              color: '#4b5563', 
                              padding: '0.1rem 0.4rem', 
                              borderRadius: '0.25rem', 
                              marginLeft: '0.5rem',
                              verticalAlign: 'middle'
                            }}>
                              MOCK
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {approval.companyName || 'Not specified'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="user-email">{approval.email}</td>
                  <td>
                    <span className="user-badge user-badge-hr">
                      {approval.workingId}
                    </span>
                  </td>
                  <td>{formatDate(approval.createdAt)}</td>
                  <td>
                    <div className="table-actions">
                      <button 
                        onClick={() => viewDetails(approval)}
                        className="action-button action-edit"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => handleApproval(approval.id, true)}
                        className="action-button action-activate"
                        title="Approve"
                        disabled={processing}
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button 
                        onClick={() => handleApproval(approval.id, false)}
                        className="action-button action-deactivate"
                        title="Reject"
                        disabled={processing}
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {showModal && selectedApproval && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            width: '100%',
            maxWidth: '32rem',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.5rem',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                HR Staff Request Details
              </h2>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setSelectedApproval(null);
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280'
                }}
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <div className="user-info" style={{ marginBottom: '1.5rem' }}>
                  <div className="user-avatar" style={{ width: '3rem', height: '3rem', fontSize: '1.25rem' }}>
                    {selectedApproval.firstName.charAt(0)}{selectedApproval.lastName.charAt(0)}
                  </div>
                  <div>
                    <div className="user-name" style={{ fontSize: '1.25rem' }}>{selectedApproval.firstName} {selectedApproval.lastName}</div>
                    <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>{selectedApproval.companyName || 'Company not specified'}</div>
                  </div>
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '1rem',
                  backgroundColor: '#f9fafb',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  marginBottom: '1.5rem'
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Email</div>
                    <div style={{ fontWeight: '500' }}>{selectedApproval.email}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Working ID</div>
                    <div style={{ fontWeight: '500' }}>{selectedApproval.workingId}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Phone Number</div>
                    <div style={{ fontWeight: '500' }}>{selectedApproval.phoneNumber || 'Not provided'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Request Date</div>
                    <div style={{ fontWeight: '500' }}>{formatDate(selectedApproval.createdAt)}</div>
                  </div>
                </div>
              </div>
              
              <div style={{
                backgroundColor: '#eff6ff',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1.5rem',
                borderLeft: '4px solid #3b82f6'
              }}>
                <h3 style={{ 
                  color: '#1e40af', 
                  fontSize: '0.875rem', 
                  fontWeight: '600', 
                  margin: '0 0 0.5rem 0' 
                }}>
                  Verification Notes
                </h3>
                <p style={{ 
                  color: '#1e3a8a', 
                  fontSize: '0.875rem', 
                  margin: 0
                }}>
                  Please verify the HR staff member's identity and company affiliation before approval.
                  Consider contacting the company directly through official channels for verification.
                </p>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb'
            }}>
              <button 
                onClick={() => handleApproval(selectedApproval.id, false)}
                className="button-secondary"
                disabled={processing}
              >
                <XCircle size={16} />
                {processing ? 'Processing...' : 'Reject Request'}
              </button>
              <button 
                onClick={() => handleApproval(selectedApproval.id, true)}
                className="button-primary"
                disabled={processing}
              >
                <CheckCircle size={16} />
                {processing ? 'Processing...' : 'Approve Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRApprovals;