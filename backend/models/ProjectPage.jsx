import React, { useState, useEffect, useMemo } from 'react'; // Import useMemo
import { useParams, Link } from 'react-router-dom';
// ... other imports

const ProjectPage = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  
  // --- Add state for search and filter ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('all'); // 'all' or a user ID

  const fetchProjectData = async () => { /* ... existing function, no changes needed ... */ };
  useEffect(() => { fetchProjectData(); }, [projectId]);

  // --- Use useMemo to calculate filtered tasks efficiently ---
  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => {
        // Search filter (case-insensitive)
        return task.title.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .filter(task => {
        // Assignee filter
        if (filterAssignee === 'all') return true;
        // Handles unassigned tasks as well
        return task.assignee?._id === filterAssignee;
      });
  }, [tasks, searchTerm, filterAssignee]); // This only re-runs when these values change

  const openEditModal = (task) => { /* ... existing function ... */ };
  const openAddModal = () => { /* ... existing function ... */ };

  if (!project) return <div>Loading...</div>;

  // Update column filters to use the `filteredTasks` list
  const todoTasks = filteredTasks.filter(t => t.status === 'ToDo');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'InProgress');
  const doneTasks = filteredTasks.filter(t => t.status === 'Done');

  return (
    <div>
      <Link to="/dashboard">← Back to Dashboard</Link>
      <h1>{project.title}</h1>
      <p>{project.description}</p>
      
      {/* --- Add UI elements for search and filter --- */}
      <div style={{ display: 'flex', gap: '20px', margin: '20px 0' }}>
        <input 
          type="text"
          placeholder="Search tasks by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
          <option value="all">All Assignees</option>
          {project.members.map(member => (
            <option key={member._id} value={member._id}>{member.name}</option>
          ))}
        </select>
        <button onClick={openAddModal}>+ Add Task</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        <TaskColumn title="To Do" tasks={todoTasks} onEditTask={openEditModal} />
        <TaskColumn title="In Progress" tasks={inProgressTasks} onEditTask={openEditModal} />
        <TaskColumn title="Done" tasks={doneTasks} onEditTask={openEditModal} />
      </div>

      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskSaved={fetchProjectData}
        projectId={projectId}
        taskToEdit={taskToEdit}
      />
    </div>
  );
};

export default ProjectPage;