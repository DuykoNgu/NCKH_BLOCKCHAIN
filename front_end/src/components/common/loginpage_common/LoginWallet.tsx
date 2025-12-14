import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as secp from "@noble/secp256k1";
import { requestNonce, verifySignatureLogin } from '@/services/authService';
import { decryptPrivateKey } from "@/ultis/cryptoVault";

export default function LoginWallet() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const hexToBytes = (hex: string): Uint8Array => {
    return new Uint8Array(hex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const address = localStorage.getItem("address");
      const vaultData = localStorage.getItem("vault");

      if (!address || !vaultData) {
        throw new Error('No wallet found. Please create a wallet first.');
      }

      const vault = JSON.parse(vaultData);
      
      const privateKey = await decryptPrivateKey(vault, password);

      const nonce = await requestNonce(address);

      if (!nonce || typeof nonce !== 'string' || nonce.length === 0) {
        throw new Error('Invalid nonce received from server');
      }
      
      const nonceBytes = hexToBytes(nonce);

      if (nonceBytes.length === 0) {
        throw new Error('Failed to convert nonce to bytes');
      }
      
      const msgHash = await crypto.subtle.digest("SHA-256", nonceBytes as any);

      const msgHashArray = new Uint8Array(msgHash);
    
      const privateKeyArray = privateKey instanceof Uint8Array ? privateKey : new Uint8Array(privateKey);

      const signature = await secp.signAsync(msgHashArray, privateKeyArray);
      const signatureHex = Array.from(signature).map(b => b.toString(16).padStart(2, '0')).join('');

      await verifySignatureLogin({
        address,
        signature: signatureHex,
      });

      localStorage.setItem("isLoggedIn", "true");
      navigate("/");
    } catch (error) {
      console.error('Login failed:', error);
      alert(`Login failed: ${(error as Error).message}`);
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