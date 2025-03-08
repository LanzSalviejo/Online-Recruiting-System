import axios from 'axios';

const API_URL = '/api/profile';

// Personal Info
export const getPersonalInfo = async () => {
  const response = await axios.get(`${API_URL}/personal-info`);
  return response.data;
};

export const updatePersonalInfo = async (data) => {
  const response = await axios.put(`${API_URL}/personal-info`, data);
  return response.data;
};

// Education
export const getEducation = async () => {
  const response = await axios.get(`${API_URL}/education`);
  return response.data;
};

export const addEducation = async (data) => {
  const response = await axios.post(`${API_URL}/education`, data);
  return response.data;
};

export const updateEducation = async (id, data) => {
  const response = await axios.put(`${API_URL}/education/${id}`, data);
  return response.data;
};

export const deleteEducation = async (id) => {
  await axios.delete(`${API_URL}/education/${id}`);
  return true;
};

// Work Experience
export const getWorkExperience = async () => {
  const response = await axios.get(`${API_URL}/experience`);
  return response.data;
};

export const addWorkExperience = async (data) => {
  const response = await axios.post(`${API_URL}/experience`, data);
  return response.data;
};

export const updateWorkExperience = async (id, data) => {
  const response = await axios.put(`${API_URL}/experience/${id}`, data);
  return response.data;
};

export const deleteWorkExperience = async (id) => {
  await axios.delete(`${API_URL}/experience/${id}`);
  return true;
};

// Job Preferences
export const getJobPreferences = async () => {
  const response = await axios.get(`${API_URL}/preferences`);
  return response.data;
};

export const addJobPreference = async (data) => {
  const response = await axios.post(`${API_URL}/preferences`, data);
  return response.data;
};

export const updateJobPreference = async (id, data) => {
  const response = await axios.put(`${API_URL}/preferences/${id}`, data);
  return response.data;
};

export const deleteJobPreference = async (id) => {
  await axios.delete(`${API_URL}/preferences/${id}`);
  return true;
};

// Profile Image
export const uploadProfileImage = async (formData) => {
  const response = await axios.post(`${API_URL}/image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};