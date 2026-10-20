import React, { createContext, useState, useContext } from 'react';
import * as authService from '../services/authService'; // Use our auth service

// 1. Create the context
const AuthContext = createContext();

// 2. Create the provider component
export const AuthProvider = ({ children }) => {
  // 3. The state that will be shared
  const [user, setUser] = useState(() => {
    // Initialize state from local storage to keep user logged in on refresh
    const storedUser = localStorage.getItem('userInfo');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // 4. Functions to modify the state
  const login = async (userData) => {
    const loggedInUser = await authService.login(userData);
    setUser(loggedInUser);
  };

  const register = async (userData) => {
    const registeredUser = await authService.register(userData);
    setUser(registeredUser);
  };

  const logout = () => {
    // authService.logout();
    // setUser(null);
    console.log('AuthContext: logout function started.');
    authService.logout(); // Removes user from localStorage
    setUser(null);      // Sets the user state to null
    console.log('AuthContext: User state has been set to null.');
  };

  // 5. The value provided to consuming components
  const value = { user, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 6. A custom hook to make it easy to use the context
export const useAuth = () => {
  return useContext(AuthContext);
};