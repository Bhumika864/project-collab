import api from './api';

// Fetches ALL projects for the logged-in user (for the dashboard)
export const getProjects = async () => {
  // This should be a simple GET request to '/projects' with no ID
  const response = await api.get('/projects');
  return response.data;
};

// Fetches a SINGLE project by its unique ID (for the project details page)
export const getProjectById = async (projectId) => {
  const response = await api.get(`/projects/${projectId}`);
  return response.data;
};

// Creates a new project
export const createProject = async (projectData) => {
  const response = await api.post('/projects', projectData);
  return response.data;
};

export const addMemberToProject = async (projectId, email, role) => {
  const response = await api.post(`/projects/${projectId}/members`, { email, role });
  return response.data;
};

export const updateMemberRole = async (projectId, memberId, role) => {
  const response = await api.put(`/projects/${projectId}/members/${memberId}`, { role });
  return response.data;
};

export const removeMember = async (projectId, memberId) => {
  const response = await api.delete(`/projects/${projectId}/members/${memberId}`);
  return response.data;
};

export const createInviteLink = async (projectId, role) => {
  const response = await api.post(`/projects/${projectId}/invite-link`, { role });
  return response.data;
};

export const revokeInviteLink = async (projectId) => {
  const response = await api.delete(`/projects/${projectId}/invite-link`);
  return response.data;
};

export const acceptInviteLink = async (token) => {
  const response = await api.post(`/projects/invitations/${token}/accept`);
  return response.data;
};

export const getProjectActivity = async (projectId, filters = {}) => {
  const response = await api.get(`/projects/${projectId}/activity`, { params: filters });
  return response.data;
};

export const getProjectAnalytics = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/analytics`);
  return response.data;
};

// Function to delete a project
export const deleteProject = async (projectId) => {
  const response = await api.delete(`/projects/${projectId}`);
  return response.data;
};

export const updateProject = async (projectId, projectData) => {
  const response = await api.put(`/projects/${projectId}`, projectData);
  return response.data;
};