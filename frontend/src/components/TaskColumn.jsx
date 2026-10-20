import React, { useState } from 'react';
import TaskCard from './TaskCard';

const TaskColumn = ({
  title,
  status,
  tasks,
  onEditTask,
  onDeleteTask,
  onMoveTask,
  canEdit,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    const taskId = event.dataTransfer.getData('text/task-id');
    if (taskId) onMoveTask(taskId, status);
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsDragOver(false);
      }}
      onDrop={handleDrop}
      className={`flex-1 rounded-lg p-4 min-h-[300px] transition-colors ${isDragOver ? 'bg-blue-900 ring-2 ring-blue-400' : 'bg-gray-800'}`}
    >
      <h3 className="text-lg font-semibold mb-4 text-white">{title}</h3>
      <div className="space-y-3">
        {tasks.map(task => (
          <TaskCard
            key={task._id}
            task={task}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            canEdit={canEdit}
            onDragStart={(event, draggedTask) => {
              event.dataTransfer.effectAllowed = 'move';
              event.dataTransfer.setData('text/task-id', draggedTask._id);
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default TaskColumn;