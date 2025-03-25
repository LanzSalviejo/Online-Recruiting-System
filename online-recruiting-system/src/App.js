import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout
import MainLayout from './components/layouts/MainLayout';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
// Import components directly if they exist, or leave commented out if they don't
// import ForgotPassword from './pages/auth/ForgotPassword';
// import ResetPassword from './pages/auth/ResetPassword';

// Public pages
import Home from './pages/Home';
import JobListings from './pages/jobs/JobListings';
import JobDetailsPage from './pages/jobs/JobDetailsPage';
// import About from './pages/About';
// import Contact from './pages/Contact';
// import FAQ from './pages/FAQ';

// Applicant pages
import ApplicantDashboard from './pages/applicant/Dashboard';
import MyApplications from './pages/applicant/MyApplications';
import ApplicationDetails from './pages/applicant/ApplicationDetails';

// HR pages
import HRDashboard from './pages/hr/Dashboard';
import JobPostings from './pages/hr/JobPostings';
import CreateJobPost from './pages/hr/CreateJobPost';
import EditJobPost from './pages/hr/EditJobPost';
import ApplicationsReview from './pages/hr/ApplicationsReview';
import ApplicationReviewDetails from './pages/hr/ApplicationReviewDetails';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import ManageUsers from './pages/admin/ManageUsers';
import EditUser from './pages/admin/EditUser';
import JobCategories from './pages/admin/JobCategories';
import HRApprovals from './pages/admin/HRApprovals';
import Reports from './pages/admin/Reports';
import CategoryReport from './pages/admin/CategoryReport';
import QualificationReport from './pages/admin/QualificationReport';

// Profile pages
import ProfilePage from './pages/Profile';
import EducationForm from './pages/profile/EducationForm';
import ExperienceForm from './pages/profile/ExperienceForm';
import PreferencesForm from './pages/profile/PreferencesForm';

// Helpers
import PrivateRoute from './components/auth/PrivateRoute';
import RoleRoute from './components/auth/RoleRoute';
import NotFound from './pages/NotFound';

// Create default placeholder component
const DefaultComponent = ({ name }) => <div>Component {name} not implemented yet</div>;

// Create placeholder component functions directly
const ForgotPasswordComponent = () => <DefaultComponent name="ForgotPassword" />;
const ResetPasswordComponent = () => <DefaultComponent name="ResetPassword" />;
const AboutComponent = () => <DefaultComponent name="About" />;
const ContactComponent = () => <DefaultComponent name="Contact" />;
const FAQComponent = () => <DefaultComponent name="FAQ" />;

function App() {
  return (
    <Router>
      <AuthProvider>
        <MainLayout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPasswordComponent />} />
            <Route path="/reset-password/:token" element={<ResetPasswordComponent />} />
            <Route path="/jobs" element={<JobListings />} />
            <Route path="/jobs/:id" element={<JobDetailsPage />} />
            <Route path="/about" element={<AboutComponent />} />
            <Route path="/contact" element={<ContactComponent />} />
            <Route path="/faq" element={<FAQComponent />} />
            
            {/* Applicant Routes */}
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <RoleRoute allowedRoles={['applicant']}>
                    <ApplicantDashboard />
                  </RoleRoute>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/applications" 
              element={
                <PrivateRoute>
                  <RoleRoute allowedRoles={['applicant']}>
                    <MyApplications />
                  </RoleRoute>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/applications/:id" 
              element={
                <PrivateRoute>
                  <RoleRoute allowedRoles={['applicant']}>
                    <ApplicationDetails />
                  </RoleRoute>
                </PrivateRoute>
              } 
            />
            
            {/* HR Routes */}
            <Route 
              path="/hr/dashboard" 
              element={
                <PrivateRoute>
                  <RoleRoute allowedRoles={['hr']}>
                    <HRDashboard />
                  </RoleRoute>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/job-postings" 
              element={
                <PrivateRoute>
                  <RoleRoute allowedRoles={['hr', 'admin']}>
                    <MainLayout>
                      <JobPostings />
                    </MainLayout>
                  </RoleRoute>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/post-job" 
              element={
                <PrivateRoute>
                  <RoleRoute allowedRoles={['hr']}>
                    <CreateJobPost />
                  </RoleRoute>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/edit-job/:id" 
              element={
                <PrivateRoute>
                  <RoleRoute allowedRoles={['hr']}>
                    <EditJobPost />
                  </RoleRoute>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/applications-review" 
              element={
                <PrivateRoute>
                  <RoleRoute allowedRoles={['hr']}>
                    <ApplicationsReview />
                  </RoleRoute>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/applications-review/:id" 
              element={
                <PrivateRoute>
                  <RoleRoute allowedRoles={['hr']}>
                    <ApplicationReviewDetails />
                  </RoleRoute>
                </PrivateRoute>
              } 
            />
            
            {/* Admin Routes */}
            <Route 
              path="/admin/dashboard" 
              element={
                <PrivateRoute>
                  <RoleRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </RoleRoute>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/manage-users" 
              element={
                <PrivateRoute>
                  <RoleRoute allowedRoles={['admin']}>
                    <ManageUsers />
                  </RoleRoute>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/manage-users/:id" 
              element={
                <PrivateRoute>
                  <RoleRoute allowedRoles={['admin']}>
                    <EditUser />
                  </RoleRoute>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/categories" 
              element={
                <PrivateRoute>
                  <RoleRoute allowedRoles={['admin']}>
                    <JobCategories />
                  </RoleRoute>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/hr-approvals" 
              element={
                <PrivateRoute>
                  <RoleRoute allowedRoles={['admin']}>
                    <HRApprovals />
                  </RoleRoute>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/reports" 
              element={
                <PrivateRoute>
                  <RoleRoute allowedRoles={['admin']}>
                    <Reports />
                  </RoleRoute>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/reports/category" 
              element={
                <PrivateRoute>
                  <RoleRoute allowedRoles={['admin']}>
                    <CategoryReport />
                  </RoleRoute>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/reports/qualification" 
              element={
                <PrivateRoute>
                  <RoleRoute allowedRoles={['admin']}>
                    <QualificationReport />
                  </RoleRoute>
                </PrivateRoute>
              } 
            />
            
            {/* Profile Routes - accessible by all logged in users */}
            <Route 
              path="/profile" 
              element={
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/profile/education/add" 
              element={
                <PrivateRoute>
                  <EducationForm />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/profile/education/edit/:id" 
              element={
                <PrivateRoute>
                  <EducationForm />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/profile/experience/add" 
              element={
                <PrivateRoute>
                  <ExperienceForm />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/profile/experience/edit/:id" 
              element={
                <PrivateRoute>
                  <ExperienceForm />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/profile/preferences/add" 
              element={
                <PrivateRoute>
                  <PreferencesForm />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/profile/preferences/edit/:id" 
              element={
                <PrivateRoute>
                  <PreferencesForm />
                </PrivateRoute>
              } 
            />
            
            {/* Redirect and 404 */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </MainLayout>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      </AuthProvider>
    </Router>
  );
}

export default App;