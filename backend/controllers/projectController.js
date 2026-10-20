const Project = require('../models/Project');
const User = require('../models/User');
const crypto = require('crypto');
const { getProjectRole } = require('../utils/projectPermissions');

const populateProject = (project, userId) => {
  const result = project.toObject();
  delete result.inviteLink;
  const roles = new Map(
    (result.memberRoles || []).map((membership) => [membership.user.toString(), membership.role])
  );
  delete result.memberRoles;
  result.members = result.members.map((member) => ({
    ...member,
    role: roles.get(member._id.toString()) || 'editor',
  }));
  result.role = getProjectRole(project, userId);
  result.isOwner = result.role === 'owner';
  return result;
};

// @desc    Create a new project
// @route   POST /api/projects
const createProject = async (req, res) => {
  const { title, description, deadline } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  try {
    const project = await Project.create({
      title,
      description,
      deadline,
      owner: req.user._id, // The owner is the currently logged-in user
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error while creating project' });
  }
};

// @desc    Get all projects for a user (owned or member of)
// @route   GET /api/projects
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      // Find projects where the user is either the owner or in the members array
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    })
      .select('-inviteLink -memberRoles')
      .populate('owner', 'name email'); // Populate owner details
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching projects' });
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // --- Permission Check ---
    // Check if the logged-in user is the owner of the project
    if (!['owner', 'editor'].includes(getProjectRole(project, req.user._id))) {
      return res.status(403).json({ message: 'Viewers cannot update this project' });
    }

    project.title = req.body.title || project.title;
    project.description = req.body.description || project.description;
    project.deadline = req.body.deadline || project.deadline;

    await project.save();

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    res.json(populateProject(populatedProject, req.user._id));
    
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating project' });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // --- Permission Check ---
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'User not authorized to delete this project' });
    }

    await project.deleteOne();
    res.json({ message: 'Project removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error while deleting project' });
  }
};

// @desc    Get a single project by ID
// @route   GET /api/projects/:id
const getProjectById = async (req, res) => {
  try {
    // Find the project and populate owner and members with their name and email
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!getProjectRole(project, req.user._id)) {
      return res.status(403).json({ message: 'You do not have access to this project' });
    }

    res.json(populateProject(project, req.user._id));

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

//Add a member to a project by email
const addProjectMember = async (req, res) => {
  const { email, role = 'editor' } = req.body;
  const { id: projectId } = req.params;

  try {
    if (!['editor', 'viewer'].includes(role)) {
      return res.status(400).json({ message: 'Role must be editor or viewer' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Permission Check: Only the project owner can add members
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the project owner can add members' });
    }

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const userToInvite = await User.findOne({ email: normalizedEmail });
    if (!userToInvite) {
      return res.status(404).json({ message: 'User with that email not found' });
    }

    // Check if user is already a member
    if (project.owner.equals(userToInvite._id)) {
      return res.status(400).json({ message: 'User is already in the project' });
    }

    if (!project.members.some((member) => member.equals(userToInvite._id))) {
      project.members.push(userToInvite._id);
    }
    project.memberRoles = project.memberRoles.filter(
      (membership) => !membership.user.equals(userToInvite._id)
    );
    project.memberRoles.push({ user: userToInvite._id, role });
    await project.save();

    const updatedProject = await Project.findById(projectId)
      .populate('owner', 'name email')
      .populate('members', 'name email');
    res.json(populateProject(updatedProject, req.user._id));

  } catch (error) {
    console.error('Failed to add project member:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateProjectMember = async (req, res) => {
  const { role } = req.body;
  if (!['editor', 'viewer'].includes(role)) {
    return res.status(400).json({ message: 'Role must be editor or viewer' });
  }

  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    if (!project.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the owner can manage members' });
    }

    const memberId = req.params.memberId;
    if (!project.members.some((member) => member.equals(memberId))) {
      return res.status(404).json({ message: 'Project member not found' });
    }

    project.memberRoles = project.memberRoles.filter(
      (membership) => !membership.user.equals(memberId)
    );
    project.memberRoles.push({ user: memberId, role });
    await project.save();
    res.json({ message: 'Member role updated' });
  } catch (error) {
    console.error('Failed to update project member:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const removeProjectMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    if (!project.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the owner can manage members' });
    }

    project.members = project.members.filter(
      (member) => !member.equals(req.params.memberId)
    );
    project.memberRoles = project.memberRoles.filter(
      (membership) => !membership.user.equals(req.params.memberId)
    );
    await project.save();
    if (req.io) {
      const sockets = await req.io.in(project._id.toString()).fetchSockets();
      for (const socket of sockets) {
        if (socket.data.userId.toString() === req.params.memberId) {
          socket.leave(project._id.toString());
        }
      }
    }
    res.json({ message: 'Member removed' });
  } catch (error) {
    console.error('Failed to remove project member:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const createInviteLink = async (req, res) => {
  const { role = 'editor' } = req.body;
  if (!['editor', 'viewer'].includes(role)) {
    return res.status(400).json({ message: 'Role must be editor or viewer' });
  }

  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    if (!project.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the owner can create invite links' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    project.inviteLink = {
      tokenHash: crypto.createHash('sha256').update(token).digest('hex'),
      role,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
    await project.save();
    res.status(201).json({ token, expiresAt: project.inviteLink.expiresAt });
  } catch (error) {
    console.error('Failed to create invite link:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const revokeInviteLink = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    if (!project.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the owner can revoke invite links' });
    }
    project.inviteLink = undefined;
    await project.save();
    res.json({ message: 'Invite link revoked' });
  } catch (error) {
    console.error('Failed to revoke invite link:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const acceptInviteLink = async (req, res) => {
  try {
    const tokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const project = await Project.findOne({
      'inviteLink.tokenHash': tokenHash,
      'inviteLink.expiresAt': { $gt: new Date() },
    });
    if (!project) {
      return res.status(404).json({ message: 'Invite link is invalid or expired' });
    }

    const alreadyMember = project.members.some((member) => member.equals(req.user._id));
    if (!project.owner.equals(req.user._id) && !alreadyMember) {
      project.members.push(req.user._id);
      project.memberRoles.push({ user: req.user._id, role: project.inviteLink.role });
      await project.save();
    }

    res.json({ projectId: project._id });
  } catch (error) {
    console.error('Failed to accept project invite:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
  getProjectById,
  addProjectMember,
  updateProjectMember,
  removeProjectMember,
  createInviteLink,
  revokeInviteLink,
  acceptInviteLink,
};