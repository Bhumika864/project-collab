import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as projectService from '../services/projectService';
import socket from '../services/socketService';

const formatValue = (value) => {
  if (!value) return 'empty';
  if (value === 'ToDo') return 'To Do';
  if (value === 'InProgress') return 'In Progress';
  return String(value);
};

const describeActivity = (activity) => {
  const actor = activity.actor?.name || 'A member';
  if (activity.action === 'created') return `${actor} created "${activity.taskTitle}"`;
  if (activity.action === 'deleted') return `${actor} deleted "${activity.taskTitle}"`;

  const changes = Object.entries(activity.changes || {}).map(([field, values]) => {
    const label = field === 'dueDate' ? 'due date' : field;
    if (field === 'status' || field === 'priority' || field === 'title') {
      return `${label}: ${formatValue(values.from)} → ${formatValue(values.to)}`;
    }
    return `updated ${label}`;
  });
  return `${actor} updated "${activity.taskTitle}"${changes.length ? ` (${changes.join(', ')})` : ''}`;
};

const ActivityFeed = ({ projectId, members = [] }) => {
  const [action, setAction] = useState('');
  const [actorId, setActorId] = useState('');
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState('');

  const fetchActivities = useCallback(async () => {
    try {
      const data = await projectService.getProjectActivity(projectId, {
        ...(action && { action }),
        ...(actorId && { actorId }),
      });
      setActivities(data);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load activity.');
    }
  }, [action, actorId, projectId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    const handleActivity = (activity) => {
      if (action && activity.action !== action) return;
      if (actorId && activity.actor?._id !== actorId) return;
      setActivities((current) => [activity, ...current.filter((entry) => entry._id !== activity._id)].slice(0, 100));
    };
    socket.on('activityCreated', handleActivity);
    return () => socket.off('activityCreated', handleActivity);
  }, [action, actorId]);

  return (
    <section className="mt-8 rounded-lg bg-gray-800 p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Activity</h2>
        <div className="flex gap-2">
          <select value={action} onChange={(event) => setAction(event.target.value)} className="rounded bg-gray-700 px-3 py-2" aria-label="Filter activity">
            <option value="">All activity</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="deleted">Deleted</option>
          </select>
          <select value={actorId} onChange={(event) => setActorId(event.target.value)} className="rounded bg-gray-700 px-3 py-2" aria-label="Filter by member">
            <option value="">All members</option>
            {members.map((member) => <option key={member._id} value={member._id}>{member.name}</option>)}
          </select>
        </div>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {!error && activities.length === 0 && <p className="text-gray-400">No activity yet.</p>}
      <ul className="space-y-3">
        {activities.map((activity) => (
          <li key={activity._id} className="border-b border-gray-700 pb-3 text-sm text-gray-300">
            {activity.task && activity.action !== 'deleted'
              ? <Link to={`/project/${projectId}#task-${activity.task}`} className="hover:text-blue-300">{describeActivity(activity)}</Link>
              : <span>{describeActivity(activity)}</span>}
            <time className="ml-2 text-xs text-gray-500" dateTime={activity.createdAt}>
              {new Date(activity.createdAt).toLocaleString()}
            </time>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default ActivityFeed;
