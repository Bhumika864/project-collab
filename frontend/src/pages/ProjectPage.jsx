import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as projectService from '../services/projectService';
import * as taskService from '../services/taskService';
import TaskColumn from '../components/TaskColumn';
import TaskModal from '../components/TaskModal';
import socket from '../services/socketService';
import EditProjectModal from '../components/EditProjectModal';
const ProjectPage = () => {
  // State for Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { projectId } = useParams();
  const navigate = useNavigate(); // Get the navigate function
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [linkRole, setLinkRole] = useState('editor');
  const [inviteUrl, setInviteUrl] = useState('');

  const fetchProjectData = useCallback(async () => {
    try {
      const projectData = await projectService.getProjectById(projectId);
      const tasksData = await taskService.getTasksForProject(projectId);
      setProject(projectData);
      setTasks(tasksData);
    } catch (error) {
      console.error("Failed to fetch project data", error);
    }
  }, [projectId]);

  useEffect(() => {
    socket.auth = { token: user?.token };
    socket.connect();
    fetchProjectData();

    socket.emit('joinProject', projectId);

    const handleTaskUpdate = (updatedTask) => {
      setTasks(currentTasks =>
        currentTasks.map(task =>
          task._id === updatedTask._id ? updatedTask : task
        )
      );
    };

    socket.on('taskUpdated', handleTaskUpdate);

    return () => {
      socket.off('taskUpdated', handleTaskUpdate);
      socket.disconnect();
    };
  }, [projectId, fetchProjectData, user?.token]);

  const handleProjectUpdated = (updated) => {
    setProject(updated); // instantly refresh UI
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    try {
      await projectService.addMemberToProject(projectId, inviteEmail, inviteRole);
      alert('Member added successfully!');
      setInviteEmail('');
      await fetchProjectData();
    } catch (error) {
      console.error('Failed to add member:', error);
      alert(error.response?.data?.message || 'An error occurred while adding the member.');
    }
  };

  const handleMemberRoleChange = async (memberId, role) => {
    try {
      await projectService.updateMemberRole(projectId, memberId, role);
      await fetchProjectData();
    } catch (error) {
      alert(error.response?.data?.message || 'Could not update member role.');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      await projectService.removeMember(projectId, memberId);
      await fetchProjectData();
    } catch (error) {
      alert(error.response?.data?.message || 'Could not remove member.');
    }
  };

  const handleCreateInviteLink = async () => {
    try {
      const { token } = await projectService.createInviteLink(projectId, linkRole);
      setInviteUrl(`${window.location.origin}/invite/${token}`);
    } catch (error) {
      alert(error.response?.data?.message || 'Could not create invite link.');
    }
  };

  const handleRevokeInviteLink = async () => {
    try {
      await projectService.revokeInviteLink(projectId);
      setInviteUrl('');
    } catch (error) {
      alert(error.response?.data?.message || 'Could not revoke invite link.');
    }
  };

  const handleCopyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
    } catch {
      alert('Copy failed. Select and copy the link manually.');
    }
  };

  const openEditModal = (task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setTaskToEdit(null);
    setIsModalOpen(true);
  };

  // --- Function to Delete project ---
  const handleDeleteProject = async () => {
    // A confirmation step is crucial for destructive actions
    if (window.confirm('Are you sure you want to delete this project and all its tasks? This action cannot be undone.')) {
      try {
        await projectService.deleteProject(projectId);
        alert('Project deleted successfully.');
        navigate('/dashboard'); // Redirect to dashboard after deletion
      } catch (error) {
        console.error('Failed to delete project:', error);
        alert('Failed to delete project.');
      }
    }
  };

  if (!project) return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Loading project...</p>
    </div>
  );

  const todoTasks = tasks.filter(t => t.status === 'ToDo');
  const inProgressTasks = tasks.filter(t => t.status === 'InProgress');
  const doneTasks = tasks.filter(t => t.status === 'Done');
  const canEdit = project.role === 'owner' || project.role === 'editor';

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskService.deleteTask(taskId);
        // Remove the task from the local state to instantly update the UI
        setTasks(currentTasks => currentTasks.filter(task => task._id !== taskId));
      } catch (error) {
        console.error('Failed to delete task:', error);
        alert('Failed to delete task.');
      }
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-6">
        <Link to="/dashboard" className="text-blue-400 hover:underline">← Back to Dashboard</Link>
        <div className="flex justify-between items-center mt-2">
          <div>
            <h1 className="text-4xl font-bold">{project.title}</h1>
            <p className="text-gray-400 mt-1">{project.description}</p>
          </div>
          <div className="flex gap-2">
            {/* Conditionally rendered Delete Project button */}
            {canEdit && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 font-semibold bg-yellow-600 rounded-md hover:bg-yellow-700"
              >
                Edit Project
              </button>
            )}
            {project.isOwner && (
              <>
                <button onClick={handleDeleteProject} className="px-4 py-2 font-semibold bg-red-600 rounded-md hover:bg-red-700">
                  Delete Project
                </button>
              </>
            )}
            {canEdit && <button onClick={openAddModal} className="px-4 py-2 font-semibold bg-blue-600 rounded-md hover:bg-blue-700">
              + Add Task
            </button>}
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-6">
        <TaskColumn title="To Do" tasks={todoTasks} onEditTask={openEditModal} onDeleteTask={handleDeleteTask} canEdit={canEdit} />
        <TaskColumn title="In Progress" tasks={inProgressTasks} onEditTask={openEditModal} onDeleteTask={handleDeleteTask} canEdit={canEdit} />
        <TaskColumn title="Done" tasks={doneTasks} onEditTask={openEditModal} onDeleteTask={handleDeleteTask} canEdit={canEdit} />
      </div>

      <div className="mt-8 p-6 bg-gray-800 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Members</h3>
        <ul className="space-y-2">
          {project.owner && <li className="text-gray-300">{project.owner.name} ({project.owner.email}) - <span className="font-bold text-white">Owner</span></li>}
          {project.members && project.members.map(member => (
            <li key={member._id} className="flex flex-wrap items-center gap-3 text-gray-300">
              <span>{member.name} ({member.email})</span>
              {project.isOwner ? <>
                <select value={member.role} onChange={(event) => handleMemberRoleChange(member._id, event.target.value)} className="rounded bg-gray-700 px-2 py-1">
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button onClick={() => handleRemoveMember(member._id)} className="text-red-400 hover:underline">Remove</button>
              </> : <span className="font-semibold">{member.role}</span>}
            </li>
          ))}
        </ul>

        {project.isOwner && <>
          <form onSubmit={handleInviteMember} className="mt-4 flex flex-wrap gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Invite user by email"
              required
              className="flex-grow px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value)} className="rounded bg-gray-700 px-3">
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <button type="submit" className="px-4 py-2 font-semibold bg-green-600 rounded-md hover:bg-green-700">Add by email</button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            <select value={linkRole} onChange={(event) => setLinkRole(event.target.value)} className="rounded bg-gray-700 px-3">
              <option value="editor">Editor link</option>
              <option value="viewer">Viewer link</option>
            </select>
            <button onClick={handleCreateInviteLink} className="rounded bg-blue-600 px-4 py-2">Create share link</button>
            {inviteUrl && <>
              <input readOnly value={inviteUrl} onFocus={(event) => event.target.select()} className="min-w-[16rem] flex-1 rounded bg-gray-700 px-3 py-2" />
              <button onClick={handleCopyInviteLink} className="rounded bg-gray-600 px-4 py-2">Copy</button>
              <button onClick={handleRevokeInviteLink} className="rounded bg-red-700 px-4 py-2">Revoke</button>
            </>}
          </div>
          <p className="mt-2 text-sm text-gray-400">Email adds an existing account. Share links work for any signed-in user and expire after 7 days.</p>
        </>}
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskSaved={fetchProjectData}
        projectId={projectId}
        taskToEdit={taskToEdit}
      />
      <EditProjectModal
        isOpen={isEditModalOpen && canEdit}
        onClose={() => setIsEditModalOpen(false)}
        project={project}
        onProjectUpdated={handleProjectUpdated}
      />
    </div>
  );
};

export default ProjectPage;