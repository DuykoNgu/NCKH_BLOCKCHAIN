import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postWalletRegister } from '@/services/authService';
import type { WalletCreateRequest } from '@/types/auth';

export default function CreateWalletForm() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Call backend to generate wallet keys
      const requestData: WalletCreateRequest = {};
      const response = await postWalletRegister(requestData);
      const { client_id, public_key, address } = response;
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('client_id', client_id);
      localStorage.setItem('public_key', public_key);
      localStorage.setItem('address', address);
      navigate('/');
    } catch (error) {
      console.error('Wallet creation failed:', error);
      alert('Failed to create wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <form onSubmit={handleSubmit} className="flex flex-col items-center w-full">
        <p className="mb-4 text-center text-white">Click to create a new wallet</p>
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-10 py-3 rounded-xl text-lg font-semibold w-[400px] disabled:opacity-50 transition duration-300 hover:scale-105 active:scale-95"
        >
          {loading ? 'Creating...' : 'Create Wallet'}
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