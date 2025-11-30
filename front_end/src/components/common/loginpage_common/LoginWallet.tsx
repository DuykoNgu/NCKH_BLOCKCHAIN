import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postWalletLogin } from '@/services/authService';

export default function LoginWallet() {
  const [input, setInput] = useState('');
  const [inputType, setInputType] = useState<'private_key' | 'address'>('private_key');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = inputType === 'private_key' ? { private_key: input } : { address: input };
      await postWalletLogin(data);
      localStorage.setItem('isLoggedIn', 'true');
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <form onSubmit={handleSubmit} className="flex flex-col items-center w-full">
        <select
          value={inputType}
          onChange={(e) => setInputType(e.target.value as 'private_key' | 'address')}
          className="mb-4 px-4 py-2 rounded-xl w-[400px] text-white border border-solid border-[1px]"
        >
          <option value="private_key">Private Key</option>
          <option value="address">Address</option>
        </select>
        <input
          type="text"
          placeholder={`Enter your ${inputType === 'private_key' ? 'private key' : 'address'}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="mb-4 px-4 py-2 rounded-xl w-[400px] text-white border border-solid border-[1px]"
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