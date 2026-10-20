const Task = require('../models/Task');
const Project = require('../models/Project');
const { getProjectRole } = require('../utils/projectPermissions');
const recordActivity = require('../utils/recordActivity');

const emitActivity = (io, projectId, activity) => {
  if (io) {
    io.to(projectId.toString()).emit('activityCreated', activity);
  }
};

// @desc    Create a new task for a project
// @route   POST /api/tasks
const createTask = async (req, res) => {
  const { title, description, projectId, assignee, status, priority, dueDate } = req.body;

  if (!title || !projectId) {
    return res.status(400).json({ message: 'Title and Project ID are required' });
  }

  try {
    // Find the project this task belongs to
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // --- Permission Check ---
    // Check if the user is a member or owner of the project
    if (!['owner', 'editor'].includes(getProjectRole(project, req.user._id))) {
      return res.status(403).json({ message: 'Only project editors can add tasks' });
    }
    
    // Create and save the new task
    const task = await Task.create({
      title,
      description,
      project: projectId,
      assignee,
      status,
      priority,
      dueDate,
    });

    const changes = { status: { from: null, to: task.status } };
    const activity = await recordActivity({
      project: projectId,
      task,
      actor: req.user._id,
      action: 'created',
      changes,
    });
    emitActivity(req.io, projectId, activity);
    res.status(201).json(task);
  } catch (error) {
    console.error('Failed to create task:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all tasks for a specific project
// @route   GET /api/tasks/project/:projectId
const getTasksForProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
        return res.status(404).json({ message: 'Project not found' });
    }

    // --- Permission Check ---
    if (!getProjectRole(project, req.user._id)) {
        return res.status(403).json({ message: 'User not authorized to view these tasks' });
    }

    const tasks = await Task.find({ project: req.params.projectId }).populate('assignee', 'name email');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    // Find the original task to perform permission checks
    let task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // --- Permission Check ---
    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    if (!['owner', 'editor'].includes(getProjectRole(project, req.user._id))) {
        return res.status(403).json({ message: 'Only project editors can update tasks' });
    }

    const fields = ['title', 'description', 'assignee', 'status', 'priority', 'dueDate'];
    const updates = Object.fromEntries(
      fields.filter((field) => Object.hasOwn(req.body, field))
        .map((field) => [field, req.body[field]])
    );
    const changes = Object.fromEntries(
      Object.entries(updates)
        .filter(([field, value]) => String(task[field] ?? '') !== String(value ?? ''))
        .map(([field, value]) => [field, { from: task[field] ?? null, to: value ?? null }])
    );
    const updatedTask = await Task.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (Object.keys(changes).length) {
      const activity = await recordActivity({
        project: task.project,
        task: updatedTask,
        actor: req.user._id,
        action: 'updated',
        changes,
      });
      emitActivity(req.io, task.project, activity);
    }

    // Emit the real-time event BEFORE sending the response.
    if (req.io) {
        req.io.to(updatedTask.project.toString()).emit('taskUpdated', updatedTask);
    }

    // Send the final, single response back to the original caller.
    res.json(updatedTask);

  } catch (error) {
    // Log the actual error on the server for better debugging
    console.error(error); 
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // --- Permission Check ---
    // Only project editors can delete tasks
    const project = await Project.findById(task.project);
    if (!project || !['owner', 'editor'].includes(getProjectRole(project, req.user._id))) {
        return res.status(403).json({ message: 'Only project editors can delete tasks' });
    }

    const activity = await recordActivity({
      project: task.project,
      task,
      actor: req.user._id,
      action: 'deleted',
    });
    await task.deleteOne();
    emitActivity(req.io, task.project, activity);
    res.json({ message: 'Task removed' });
  } catch (error) {
    console.error('Failed to delete task:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all tasks for the logged-in user
// @route   GET /api/tasks/mytasks
const getMyTasks = async (req, res) => {
  try {
    // Find all projects where the user is an owner or member
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    }).select('_id'); // We only need the project IDs

    const projectIds = projects.map(p => p._id);

    // Find all tasks that belong to those projects
    const tasks = await Task.find({ project: { $in: projectIds } });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  createTask,
  getTasksForProject,
  updateTask,
  deleteTask,
  getMyTasks,
};