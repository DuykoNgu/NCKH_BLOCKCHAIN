import React, { useState } from 'react';

interface MnemonicBackupProps {
  mnemonic: string;
  address: string;
  onConfirmed: () => void;
}

export default function MnemonicBackup({ mnemonic, address, onConfirmed }: MnemonicBackupProps) {
  const [confirmed, setConfirmed] = useState(false);
  const words = mnemonic.split(' ');

  const handleConfirmBackup = () => {
    if (confirmed) {
      onConfirmed();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900/95 rounded-2xl p-6 w-full max-w-[500px] mx-4 shadow-2xl border border-gray-700">
        <h2 className="text-xl font-bold text-white text-center mb-2">Backup Your Wallet</h2>
        <p className="text-yellow-400 text-sm text-center mb-4">
          ⚠️ Write down these 12 words and keep them safe. They are the ONLY way to recover your wallet!
        </p>
        
        <div className="bg-black/50 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-3 gap-2">
            {words.map((word, index) => (
              <div key={index} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                <span className="text-gray-500 text-xs">{index + 1}.</span>
                <span className="text-white font-medium">{word}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
          <p className="text-gray-400 text-xs">
            <strong className="text-white">Address:</strong> {address}
          </p>
        </div>

        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-white text-sm">I have backed up my seed phrase</span>
        </label>

        <button
          onClick={handleConfirmBackup}
          disabled={!confirmed}
          className="w-full bg-green-600 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
        >
          Continue to Login
        </button>
      </div>
    </div>
  );
}
