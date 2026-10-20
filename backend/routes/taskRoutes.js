const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasksForProject,
  updateTask,
  deleteTask,
  getMyTasks,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.post('/', protect, createTask);
router.get('/project/:projectId', protect, getTasksForProject);
router.get('/mytasks', protect, getMyTasks);
router.put('/:id', protect, updateTask);
router.delete('/:id', protect, deleteTask);

module.exports = router;