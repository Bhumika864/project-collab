const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  updateProjectMember,
  removeProjectMember,
  createInviteLink,
  revokeInviteLink,
  acceptInviteLink,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

// All of these routes are protected and require a logged-in user
router.route('/').post(protect, createProject).get(protect, getProjects);

router.post('/invitations/:token/accept', protect, acceptInviteLink);
router.route('/:id').get(protect, getProjectById);

router.route('/:id/members').post(protect, addProjectMember);
router.route('/:id/members/:memberId')
  .put(protect, updateProjectMember)
  .delete(protect, removeProjectMember);
router.post('/:id/invite-link', protect, createInviteLink);
router.delete('/:id/invite-link', protect, revokeInviteLink);

router
  .route('/:id')
  .put(protect, updateProject)
  .delete(protect, deleteProject);

module.exports = router;