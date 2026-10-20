import { useCallback, useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import * as projectService from '../services/projectService';
import socket from '../services/socketService';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const ProjectAnalytics = ({ projectId }) => {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');

  const fetchAnalytics = useCallback(async () => {
    try {
      setAnalytics(await projectService.getProjectAnalytics(projectId));
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load analytics.');
    }
  }, [projectId]);

  useEffect(() => {
    fetchAnalytics();
    socket.on('activityCreated', fetchAnalytics);
    return () => socket.off('activityCreated', fetchAnalytics);
  }, [fetchAnalytics]);

  if (error) {
    return <section className="mt-8 rounded-lg bg-gray-800 p-6 text-red-400">{error}</section>;
  }
  if (!analytics) {
    return <section className="mt-8 rounded-lg bg-gray-800 p-6 text-gray-400">Loading analytics...</section>;
  }

  const chartData = {
    labels: analytics.completionTrend.map(({ date }) => new Date(`${date}T00:00:00`).toLocaleDateString()),
    datasets: [{
      label: 'Completed tasks',
      data: analytics.completionTrend.map(({ completed }) => completed),
      borderColor: '#60a5fa',
      backgroundColor: '#60a5fa',
      tension: 0.3,
    }],
  };

  return (
    <section className="mt-8 rounded-lg bg-gray-800 p-6">
      <h2 className="mb-4 text-xl font-semibold">Project analytics</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded bg-gray-700 p-4"><p className="text-sm text-gray-400">Tasks</p><p className="text-2xl font-bold">{analytics.totalTasks}</p></div>
        <div className="rounded bg-gray-700 p-4"><p className="text-sm text-gray-400">Completed</p><p className="text-2xl font-bold">{analytics.completedTasks}</p></div>
        <div className="rounded bg-gray-700 p-4"><p className="text-sm text-gray-400">Overdue</p><p className="text-2xl font-bold">{analytics.overdueTasks}</p></div>
        <div className="rounded bg-gray-700 p-4">
          <p className="text-sm text-gray-400">Average cycle time</p>
          <p className="text-2xl font-bold">{analytics.averageCycleTimeHours === null ? '—' : `${analytics.averageCycleTimeHours}h`}</p>
        </div>
      </div>
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 font-medium">Completions · last 7 days</h3>
          <Line data={chartData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }} />
        </div>
        <div>
          <h3 className="mb-2 font-medium">Task workload</h3>
          {analytics.workloadByMember.length
            ? <ul className="space-y-3">
              {analytics.workloadByMember.map((member) => (
                <li key={member.userId || 'unassigned'} className="flex justify-between border-b border-gray-700 pb-2 text-gray-300">
                  <span>{member.name}</span><span>{member.tasks}</span>
                </li>
              ))}
            </ul>
            : <p className="text-gray-400">No active tasks.</p>}
        </div>
      </div>
      <p className="mt-4 text-xs text-gray-500">Cycle time is measured for tasks whose status changes have been tracked since activity logging was enabled.</p>
    </section>
  );
};

export default ProjectAnalytics;
