import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const TaskStatusChart = ({ tasks }) => {
  // Process the task data to count statuses
  const statusCounts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});

  const data = {
    labels: ['To Do', 'In Progress', 'Done'],
    datasets: [
      {
        label: '# of Tasks',
        data: [
          statusCounts.ToDo || 0,
          statusCounts.InProgress || 0,
          statusCounts.Done || 0,
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(75, 192, 192, 0.5)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div style={{ maxWidth: '300px', margin: 'auto' }}>
      <h3>Tasks by Status</h3>
      <Pie data={data} />
    </div>
  );
};

export default TaskStatusChart;