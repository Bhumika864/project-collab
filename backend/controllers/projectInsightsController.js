const Activity = require('../models/Activity');
const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { getProjectRole } = require('../utils/projectPermissions');

const getAuthorizedProject = async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404).json({ message: 'Project not found' });
    return null;
  }
  if (!getProjectRole(project, req.user._id)) {
    res.status(403).json({ message: 'You do not have access to this project' });
    return null;
  }
  return project;
};

const getProjectActivity = async (req, res) => {
  try {
    const project = await getAuthorizedProject(req, res);
    if (!project) return;

    const { action, actorId } = req.query;
    if (action && !['created', 'updated', 'deleted'].includes(action)) {
      return res.status(400).json({ message: 'Invalid activity action' });
    }
    if (actorId && !mongoose.Types.ObjectId.isValid(actorId)) {
      return res.status(400).json({ message: 'Invalid member filter' });
    }

    const filter = { project: project._id };
    if (action) filter.action = action;
    if (actorId) filter.actor = actorId;

    const activities = await Activity.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('actor', 'name email');
    res.json(activities);
  } catch (error) {
    console.error('Failed to fetch project activity:', error);
    res.status(500).json({ message: 'Could not fetch project activity' });
  }
};

const getProjectAnalytics = async (req, res) => {
  try {
    const project = await getAuthorizedProject(req, res);
    if (!project) return;

    const [tasks, activities] = await Promise.all([
      Task.find({ project: project._id }).populate('assignee', 'name'),
      Activity.find({ project: project._id, 'changes.status': { $exists: true } })
        .sort({ createdAt: 1 })
        .select('task action changes createdAt'),
    ]);

    const now = new Date();
    const completedTasks = tasks.filter((task) => task.status === 'Done');
    const overdueTasks = tasks.filter(
      (task) => task.status !== 'Done' && task.dueDate && task.dueDate < now
    );
    const completionByTask = new Map();
    const completionTrend = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setUTCHours(0, 0, 0, 0);
      date.setUTCDate(date.getUTCDate() - (6 - index));
      return { date: date.toISOString().slice(0, 10), completed: 0 };
    });
    const trendByDate = new Map(completionTrend.map((day) => [day.date, day]));
    const cycleTimes = [];

    for (const activity of activities) {
      const statusChange = activity.changes?.status;
      if (!statusChange || !activity.task) continue;
      const taskId = activity.task.toString();
      const eventTime = activity.createdAt;
      let tracking = completionByTask.get(taskId);
      if (!tracking) {
        tracking = { startedAt: null, completed: false };
      }

      if (statusChange.to === 'InProgress') {
        tracking.startedAt = eventTime;
        tracking.completed = false;
      } else if (statusChange.to === 'Done') {
        if (!tracking.completed) {
          const trendDay = trendByDate.get(eventTime.toISOString().slice(0, 10));
          if (trendDay) trendDay.completed += 1;
          if (tracking.startedAt) {
            cycleTimes.push((eventTime - tracking.startedAt) / (1000 * 60 * 60));
          }
        }
        tracking.completed = true;
      } else if (statusChange.to === 'ToDo') {
        tracking.startedAt = eventTime;
        tracking.completed = false;
      }

      completionByTask.set(taskId, tracking);
    }

    const workloadByMember = new Map();
    for (const task of tasks) {
      if (task.status === 'Done') continue;
      const key = task.assignee?._id.toString() || 'unassigned';
      const current = workloadByMember.get(key) || {
        userId: task.assignee?._id || null,
        name: task.assignee?.name || 'Unassigned',
        tasks: 0,
      };
      current.tasks += 1;
      workloadByMember.set(key, current);
    }

    res.json({
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
      averageCycleTimeHours: cycleTimes.length
        ? Math.round(cycleTimes.reduce((sum, hours) => sum + hours, 0) / cycleTimes.length)
        : null,
      completionTrend,
      workloadByMember: [...workloadByMember.values()].sort((a, b) => b.tasks - a.tasks),
    });
  } catch (error) {
    console.error('Failed to fetch project analytics:', error);
    res.status(500).json({ message: 'Could not fetch project analytics' });
  }
};

module.exports = { getProjectActivity, getProjectAnalytics };
