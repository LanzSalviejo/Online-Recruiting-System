import React, { useState, useEffect } from 'react';
import { Users, Shield, CheckCircle, XCircle, AlertTriangle, Eye } from 'lucide-react';
import api from '../../services/api';

const HRApprovals = () => {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      // In a real application, you would call the API endpoint
      // const response = await api.get('/admin/hr/pending-approvals');
      // setPendingApprovals(response.data);
      
      // Mock data for demonstration
      setTimeout(() => {
        const mockApprovals = [
          {
            id: '101',
            name: 'Emily Rogers',
            email: 'emily@company.com',
            workingId: 'HR-2025-01',
            company: 'Tech Solutions Inc.',
            phoneNumber: '555-123-4567',
            requestDate: '2025-02-16T00:00:00.000Z'
          },
          {
            id: '102',
            name: 'Daniel Wilson',
            email: 'daniel@company.com',
            workingId: 'HR-2025-02',
            company: 'Global Innovations Ltd.',
            phoneNumber: '555-987-6543',
            requestDate: '2025-02-15T00:00:00.000Z'
          },
          {
            id: '103',
            name: 'Jessica Brown',
            email: 'jessica@company.com',
            workingId: 'HR-2025-03',
            company: 'Creative Minds Corp.',
            phoneNumber: '555-567-8901',
            requestDate: '2025-02-14T00:00:00.000Z'
          }
        ];
        
        setPendingApprovals(mockApprovals);
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Error fetching pending HR approvals:', err);
      setError('Failed to load pending HR approval requests. Please try again.');
      setLoading(false);
    }
  };

  const handleApproval = async (id, approved) => {
    try {
      // In a real application, you would call the API endpoint
      // await api.put(`/admin/hr/${id}/approve`, { approved });
      
      // Update local state
      setPendingApprovals(pendingApprovals.filter(approval => approval.id !== id));
      setShowModal(false);
      setSelectedApproval(null);
    } catch (err) {
      console.error(`Error ${approved ? 'approving' : 'rejecting'} HR staff:`, err);
      setError(`Failed to ${approved ? 'approve' : 'reject'} HR staff. Please try again.`);
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
                        {approval.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="user-name">{approval.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {approval.company}
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
                  <td>{formatDate(approval.requestDate)}</td>
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
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button 
                        onClick={() => handleApproval(approval.id, false)}
                        className="action-button action-deactivate"
                        title="Reject"
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
                    {selectedApproval.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="user-name" style={{ fontSize: '1.25rem' }}>{selectedApproval.name}</div>
                    <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>{selectedApproval.company}</div>
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
                    <div style={{ fontWeight: '500' }}>{selectedApproval.phoneNumber}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Request Date</div>
                    <div style={{ fontWeight: '500' }}>{formatDate(selectedApproval.requestDate)}</div>
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
              >
                <XCircle size={16} />
                Reject Request
              </button>
              <button 
                onClick={() => handleApproval(selectedApproval.id, true)}
                className="button-primary"
              >
                <CheckCircle size={16} />
                Approve Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRApprovals;