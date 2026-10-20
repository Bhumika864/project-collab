import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as projectService from '../services/projectService';
import * as taskService from '../services/taskService';
import ProjectList from '../components/ProjectList';
import CreateProjectModal from '../components/CreateProjectModal';
import TaskStatusChart from '../components/TaskStatusChart';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use Promise.all to fetch in parallel
        const [userProjects, userTasks] = await Promise.all([
          projectService.getProjects(),
          taskService.getMyTasks(),
        ]);

        // --- FOR DEBUGGING ---
        console.log('Fetched Projects from API:', userProjects);

        setProjects(userProjects);
        setTasks(userTasks);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    fetchData();
  }, []);

  const handleProjectCreated = (newProject) => { setProjects([...projects, newProject]); };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Welcome, {user.name}!</h1>
        {/* <button onClick={logout} className="px-4 py-2 font-semibold bg-red-600 rounded-md hover:bg-red-700"> */}
        <button 
          onClick={() => {
            console.log('Logout button clicked on DashboardPage.');
            logout();
          }} 
          className="px-4 py-2 font-semibold bg-red-600 rounded-md hover:bg-red-700"
        >
          Logout
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="md:col-span-2 p-6 bg-gray-800 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">At a Glance</h2>
          <p className="text-lg text-gray-400">Total Projects: <span className="font-bold text-white">{projects.length}</span></p>
          <p className="text-lg text-gray-400">Total Tasks: <span className="font-bold text-white">{tasks.length}</span></p>
        </div>
        <div className="p-6 bg-gray-800 rounded-lg">
          <TaskStatusChart tasks={tasks} />
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Your Projects</h2>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 font-semibold bg-blue-600 rounded-md hover:bg-blue-700">
          + Create New Project
        </button>
      </div>

      <ProjectList projects={projects} />
      
      <CreateProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
};

export default DashboardPage;