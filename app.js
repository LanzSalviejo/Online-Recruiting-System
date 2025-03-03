import React, { useState, useEffect } from "react";
import { AuthService } from "./services";
import { LoginPage, RegisterPage } from "./authPages";
import {
  ApplicantDashboard,
  JobListPage,
  JobDetailPage,
  ApplicationsListPage,
} from "./applicantPages";

function App() {
  // State to manage auth status
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Initialize auth state from local storage on app load
  useEffect(() => {
    const initializeAuth = () => {
      const user = AuthService.getCurrentUser();
      const isAuthenticated = AuthService.isAuthenticated();

      setUser(user);
      setIsAuthenticated(isAuthenticated);
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Handle navigation changes
  useEffect(() => {
    const handleNavigation = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handleNavigation);

    return () => {
      window.removeEventListener("popstate", handleNavigation);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  // Handle auth pages
  if (currentPath === "/login") {
    return <LoginPage />;
  }

  if (currentPath === "/register") {
    return <RegisterPage />;
  }

  // Check authentication
  if (!isAuthenticated) {
    window.location.href = "/login";
    return null;
  }

  // Route to appropriate dashboard based on user type
  if (currentPath === "/") {
    if (user.accountType === "APPLICANT") {
      window.location.href = "/applicant/dashboard";
    } else if (user.accountType === "HR") {
      window.location.href = "/hr/dashboard";
    } else if (user.accountType === "ADMIN") {
      window.location.href = "/admin/dashboard";
    }
    return null;
  }

  // Render appropriate component based on path
  const renderComponent = () => {
    // Extract path parts
    const pathParts = currentPath.split("/").filter(Boolean);
    const userType = pathParts[0];
    const page = pathParts[1];
    const id = pathParts[2];

    // Applicant routes
    if (userType === "applicant") {
      if (user.accountType !== "APPLICANT") {
        window.location.href = "/";
        return null;
      }

      switch (page) {
        case "dashboard":
          return <ApplicantDashboard />;
        case "jobs":
          if (id) {
            return <JobDetailPage jobId={id} />;
          } else {
            return <JobListPage />;
          }
        case "applications":
          return <ApplicationsListPage />;
        default:
          return <div>Page not found</div>;
      }
    }

    // HR routes (would be implemented in a similar way)
    if (userType === "hr") {
      if (user.accountType !== "HR") {
        window.location.href = "/";
        return null;
      }

      switch (page) {
        case "dashboard":
          return <div>HR Dashboard (not implemented in this example)</div>;
        case "jobs":
          if (id) {
            return <div>Edit Job (not implemented in this example)</div>;
          } else {
            return <div>HR Jobs List (not implemented in this example)</div>;
          }
        case "applications":
          return (
            <div>Applications Review (not implemented in this example)</div>
          );
        default:
          return <div>Page not found</div>;
      }
    }

    // Admin routes (would be implemented in a similar way)
    if (userType === "admin") {
      if (user.accountType !== "ADMIN") {
        window.location.href = "/";
        return null;
      }

      switch (page) {
        case "dashboard":
          return <div>Admin Dashboard (not implemented in this example)</div>;
        case "staff":
          return (
            <div>HR Staff Management (not implemented in this example)</div>
          );
        case "categories":
          return (
            <div>Category Management (not implemented in this example)</div>
          );
        case "reports":
          return <div>Report Generator (not implemented in this example)</div>;
        default:
          return <div>Page not found</div>;
      }
    }

    // Not found
    return <div>Page not found</div>;
  };

  return <div className="app-container">{renderComponent()}</div>;
}

export default App;
