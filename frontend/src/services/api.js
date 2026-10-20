import axios from 'axios';

// Create a new Axios instance with a custom configuration
const api = axios.create({
  // Set the base URL for all API requests
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
});

/*
  Add a request interceptor to include the token in all requests.
  An interceptor is a function that runs BEFORE the request is sent.
*/
api.interceptors.request.use(
  (config) => {
    // 1. Get the user's information from local storage
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    // 2. If the user is logged in, add the Bearer token to the headers
    if (userInfo && userInfo.token) {
      config.headers.Authorization = `Bearer ${userInfo.token}`;
    }

    // 3. Return the modified configuration
    return config;
  },
  (error) => {
    // Handle the error if something goes wrong
    return Promise.reject(error);
  }
);

export default api;