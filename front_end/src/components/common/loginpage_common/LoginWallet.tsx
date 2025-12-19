import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWallet } from '@/services/authService';

export default function LoginWallet() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log('[LoginWallet] Starting login process');
    try {
      await loginWallet(password);
      console.log('[LoginWallet] Login successful, redirecting to home');
      navigate("/");
    } catch (error) {
      console.error('[LoginWallet] Login failed:', error);
      const errorMessage = (error as Error).message;
      console.error('[LoginWallet] Error details:', errorMessage);
      alert(`Login failed: ${errorMessage}`);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <form onSubmit={handleSubmit} className="flex flex-col items-center w-full">
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 px-4 py-2 rounded-xl w-[400px] text-white border border-solid"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-10 py-3 rounded-xl text-lg font-semibold w-[400px] disabled:opacity-50 transition duration-300 hover:scale-105 active:scale-95"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <button
        onClick={() => navigate('/login')}
        className="mt-4 bg-gray-600 text-white px-10 py-3 rounded-xl text-lg font-semibold w-[400px] transition duration-300 hover:scale-105 active:scale-95"
      >
        Back
      </button>
    </div>
  );
}