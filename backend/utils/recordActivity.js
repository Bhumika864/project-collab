const Activity = require('../models/Activity');

const recordActivity = async ({ project, task, actor, action, changes }) => {
  const activity = await Activity.create({
    project,
    task: task?._id,
    taskTitle: task.title,
    actor,
    action,
    changes,
  });
  return activity.populate('actor', 'name email');
};

module.exports = recordActivity;
