import React from 'react';

const TaskCard = ({ task, onEdit, onDelete, canEdit }) => {
  return (
    <div id={`task-${task._id}`} className="bg-gray-700 rounded-md p-3 shadow-sm">
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-white">{task.title}</h4>
        {canEdit && <>
          <button onClick={() => onEdit(task)} className="text-xs text-gray-400 hover:text-white">Edit</button>
          <button onClick={() => onDelete(task._id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
        </>}
      </div>
      <p className="text-sm text-gray-300 mt-1">{task.description}</p>
    </div>
  );
};

export default TaskCard;