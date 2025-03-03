const ApiService = {
  API_URL: "http://localhost:8000/api/",

  // Helper to get authentication headers
  getHeaders() {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Token ${token}` : "",
      "X-CSRFToken": this.getCsrfToken(),
    };
  },

  // Get CSRF token from cookies
  getCsrfToken() {
    const name = "csrftoken";
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return "";
  },

  // Generic GET request
  async get(endpoint) {
    try {
      const response = await fetch(`${this.API_URL}${endpoint}`, {
        method: "GET",
        headers: this.getHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`GET request failed: ${endpoint}`, error);
      throw error;
    }
  },

  // Generic POST request
  async post(endpoint, data) {
    try {
      const response = await fetch(`${this.API_URL}${endpoint}`, {
        method: "POST",
        headers: this.getHeaders(),
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`POST request failed: ${endpoint}`, error);
      throw error;
    }
  },

  // Generic PUT request
  async put(endpoint, data) {
    try {
      const response = await fetch(`${this.API_URL}${endpoint}`, {
        method: "PUT",
        headers: this.getHeaders(),
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`PUT request failed: ${endpoint}`, error);
      throw error;
    }
  },

  // Generic DELETE request
  async delete(endpoint) {
    try {
      const response = await fetch(`${this.API_URL}${endpoint}`, {
        method: "DELETE",
        headers: this.getHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error(`DELETE request failed: ${endpoint}`, error);
      throw error;
    }
  },
};

// Auth Service for handling authentication
const AuthService = {
  async login(email, password) {
    try {
      const response = await ApiService.post("auth/login/", {
        email,
        password,
      });

      if (response.token) {
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
      }

      return response;
    } catch (error) {
      throw new Error("Login failed. Please check your credentials.");
    }
  },

  async register(userData) {
    try {
      const response = await ApiService.post("auth/register/", userData);

      if (response.token) {
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
      }

      return response;
    } catch (error) {
      throw new Error("Registration failed. Please try again.");
    }
  },

  logout() {
    ApiService.post("auth/logout/").catch((error) =>
      console.error("Logout error:", error)
    );
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  },

  getCurrentUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem("token");
  },
};

// Job Service for job-related operations
const JobService = {
  async getJobs(filters = {}) {
    const queryParams = new URLSearchParams();

    // Add filters to query params
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        queryParams.append(key, filters[key]);
      }
    });

    const queryString = queryParams.toString()
      ? `?${queryParams.toString()}`
      : "";
    return await ApiService.get(`jobs/${queryString}`);
  },

  async getJobById(id) {
    return await ApiService.get(`jobs/${id}/`);
  },

  async createJob(jobData) {
    return await ApiService.post("jobs/", jobData);
  },

  async updateJob(id, jobData) {
    return await ApiService.put(`jobs/${id}/`, jobData);
  },

  async deleteJob(id) {
    return await ApiService.delete(`jobs/${id}/`);
  },
};

// Application Service for application-related operations
const ApplicationService = {
  async getApplications(filters = {}) {
    const queryParams = new URLSearchParams();

    // Add filters to query params
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        queryParams.append(key, filters[key]);
      }
    });

    const queryString = queryParams.toString()
      ? `?${queryParams.toString()}`
      : "";
    return await ApiService.get(`applications/${queryString}`);
  },

  async getApplicationById(id) {
    return await ApiService.get(`applications/${id}/`);
  },

  async submitApplication(applicationData) {
    return await ApiService.post("applications/", applicationData);
  },

  async withdrawApplication(id) {
    return await ApiService.delete(`applications/${id}/`);
  },
};

// User Service for user profile operations
const UserService = {
  async updateProfile(userData) {
    return await ApiService.put("auth/profile/", userData);
  },

  async updatePreferences(preferencesData) {
    return await ApiService.post("preferences/", preferencesData);
  },

  async getPreferences() {
    return await ApiService.get("preferences/");
  },
};

// Category Service for job category operations
const CategoryService = {
  async getCategories() {
    return await ApiService.get("categories/");
  },

  async createCategory(categoryData) {
    return await ApiService.post("categories/", categoryData);
  },

  async updateCategory(id, categoryData) {
    return await ApiService.put(`categories/${id}/`, categoryData);
  },

  async deleteCategory(id) {
    return await ApiService.delete(`categories/${id}/`);
  },
};

// Report Service for generating reports
const ReportService = {
  async generateReport(reportType, year, month = null) {
    const queryParams = new URLSearchParams({
      type: reportType,
      year: year,
    });

    if (month) {
      queryParams.append("month", month);
    }

    return await ApiService.get(`reports/?${queryParams.toString()}`);
  },
};

export {
  ApiService,
  AuthService,
  JobService,
  ApplicationService,
  UserService,
  CategoryService,
  ReportService,
};
