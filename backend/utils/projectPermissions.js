const getProjectRole = (project, userId) => {
  if (project.owner.equals(userId)) {
    return 'owner';
  }

  if (!project.members.some((member) => member.equals(userId))) {
    return null;
  }

  const membership = (project.memberRoles || []).find((entry) => entry.user.equals(userId));
  return membership?.role || 'editor';
};

module.exports = { getProjectRole };
