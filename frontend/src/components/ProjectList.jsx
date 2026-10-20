import React from 'react';
import { Link } from 'react-router-dom';

const ProjectList = ({ projects }) => {
  if (projects.length === 0) {
    return <p className="text-gray-400 mt-4">You have no projects yet. Create one to get started!</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Link to={`/project/${project._id}`} key={project._id} className="block p-6 bg-gray-800 rounded-lg shadow-lg hover:bg-gray-700 transition-colors duration-200">
          <h3 className="text-xl font-bold text-white">{project.title}</h3>
          <p className="mt-2 text-gray-400">{project.description}</p>
        </Link>
      ))}
    </div>
  );
};

export default ProjectList;