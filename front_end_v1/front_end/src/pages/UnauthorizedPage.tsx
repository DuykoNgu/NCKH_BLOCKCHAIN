import React from 'react';

const UnauthorizedPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="p-8 rounded border border-border text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Unauthorized</h1>
        <p className="text-gray-700 mb-6">You do not have permission to access this page.</p>
        <button 
          onClick={() => window.location.href = '/'} 
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;