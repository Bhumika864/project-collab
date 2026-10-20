import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Function to handle one-click demo login
  const handleDemoLogin = async (email, password) => {
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (error) {
      console.error("Demo login failed", error);
      alert("Demo login failed. Please try again or register a new account.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      <h1 className="text-5xl font-bold mb-4">Welcome to the Project Manager</h1>
      <p className="text-lg text-gray-300 max-w-2xl mb-8">
        A full-stack, real-time collaborative tool built with the MERN stack and Socket.io.
      </p>

      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-4">Guest Access</h3>
        <p className="text-sm text-gray-400 mb-6">
          To test the application and its collaborative features without registering, you can use the following pre-configured demo accounts.
        </p>
        <div className="space-y-3">
          <button 
            onClick={() => handleDemoLogin('user1@demo.com', 'password123')} 
            className="w-full py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
          >
            Login as Demo User 1
          </button>
          <button 
            onClick={() => handleDemoLogin('user2@demo.com', 'password123')} 
            className="w-full py-2 font-semibold text-white bg-teal-600 rounded-md hover:bg-teal-700 transition-colors"
          >
            Login as Demo User 2
          </button>
        </div>
        <p className="text-sm text-gray-400 mb-6">
          <br></br>Performance Note: The backend is deployed on a free-tier Render instance, which may "spin down" after a period of inactivity. The first request (like logging in) may take 30-50 seconds to complete as the server restarts. Subsequent requests will be much faster.
        </p>
        <div className="mt-6 pt-6 border-t border-gray-700 text-sm text-gray-400">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-500 hover:underline">
              Login here
            </Link>
          </p>
          <p className="mt-2">
            Or create a new one:{' '}
            <Link to="/register" className="font-medium text-blue-500 hover:underline">
              Register Your Own Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;