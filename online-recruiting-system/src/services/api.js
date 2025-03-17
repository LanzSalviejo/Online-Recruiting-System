import axios from 'axios';

// Set the base URL for the API
// Note: If you're using Create React App, you'll need to prefix it with REACT_APP_
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Add response interceptor for handling common errors
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response || error);
    
    // Handle unauthorized errors (expired or invalid tokens)
    if (error.response && error.response.status === 401) {
      console.log('Unauthorized access, redirecting to login');
      localStorage.removeItem('token');
      // Only redirect if we're not already on the login page to avoid infinite loops
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Add request interceptor to log requests in development
api.interceptors.request.use(
  config => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

export default api;