import React from 'react';

const Home: React.FC = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Welcome to Home Page</h1>
      <p>You are logged in!</p>
      <button onClick={() => {
        localStorage.removeItem('isLoggedIn');
        window.location.href = '/signin';
      }}>
        Logout
      </button>
    </div>
  );
};

export default Home;