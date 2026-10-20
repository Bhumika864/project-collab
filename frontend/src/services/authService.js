import api from './api'; // Import our pre-configured api instance

// Function to handle user registration
export const register = async (userData) => {
  const response = await api.post('/users/register', userData);

  // If registration is successful, save user info to local storage
  if (response.data) {
    localStorage.setItem('userInfo', JSON.stringify(response.data));
  }
  return response.data;
};

// Function to handle user login
export const login = async (userData) => {
  const response = await api.post('/users/login', userData);

  // If login is successful, save user info to local storage
  if (response.data) {
    localStorage.setItem('userInfo', JSON.stringify(response.data));
  }
  return response.data;
};

// Function to handle user logout
export const logout = () => {
  localStorage.removeItem('userInfo');
};