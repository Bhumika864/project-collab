import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as projectService from '../services/projectService';

const InvitePage = () => {
  const { token } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    projectService.acceptInviteLink(token)
      .then(({ projectId }) => navigate(`/project/${projectId}`, { replace: true }))
      .catch((requestError) => {
        setError(requestError.response?.data?.message || 'Could not accept this invitation.');
      });
  }, [navigate, token, user]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-center">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Project invitation</h1>
          <p>Log in or create an account to join this project.</p>
          <div className="flex justify-center gap-4">
            <Link className="text-blue-400 hover:underline" to="/login" state={{ from: location }}>Login</Link>
            <Link className="text-blue-400 hover:underline" to="/register" state={{ from: location }}>Register</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>{error || 'Joining project...'}</p>
    </div>
  );
};

export default InvitePage;
