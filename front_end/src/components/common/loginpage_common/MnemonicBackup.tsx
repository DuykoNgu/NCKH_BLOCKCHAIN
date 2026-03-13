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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card rounded-2xl p-6 w-full max-w-[500px] mx-4 shadow-2xl border border-border">
        <h2 className="text-xl font-bold text-foreground text-center mb-2">Backup Your Wallet</h2>
        <p className="text-yellow-600 text-sm text-center mb-4">
          ⚠️ Write down these 12 words and keep them safe. They are the ONLY way to recover your wallet!
        </p>
        
        <div className="bg-muted rounded-xl p-4 mb-4">
          <div className="grid grid-cols-3 gap-2">
            {words.map((word, index) => (
              <div key={index} className="flex items-center gap-2 bg-background rounded-lg px-3 py-2">
                <span className="text-muted-foreground text-xs">{index + 1}.</span>
                <span className="text-foreground font-medium">{word}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-3 mb-4">
          <p className="text-muted-foreground text-xs">
            <strong className="text-foreground">Address:</strong> {address}
          </p>
        </div>

        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-foreground text-sm">I have backed up my seed phrase</span>
        </label>

        <button
          onClick={handleConfirmBackup}
          disabled={!confirmed}
          className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-colors"
        >
          Continue to Login
        </button>
      </div>
    </div>
  );
}
