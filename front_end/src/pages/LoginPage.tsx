import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Logo3D from "@/components/common/loginpage_common/Logo3D";
import LoginButton from "@/components/common/loginpage_common/LoginButton";
import CreateWalletForm from "@/components/common/loginpage_common/CreateWalletForm";
import LoginWallet from "@/components/common/loginpage_common/LoginWallet";
import MnemonicBackup from "@/components/common/loginpage_common/MnemonicBackup";

const LoginPage: React.FC = () => {
  const { type } = useParams<{ type?: string }>();
  const navigate = useNavigate();
  
  // State cho mnemonic backup
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [address, setAddress] = useState<string>('');

  const handleWalletCreated = (newMnemonic: string, newAddress: string) => {
    setMnemonic(newMnemonic);
    setAddress(newAddress);
  };

  const handleBackupConfirmed = () => {
    setMnemonic(null);
    setAddress('');
    navigate("/login/existing");
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center">
      <div className="animate-bounce-in-up">
        {mnemonic ? (
          <MnemonicBackup mnemonic={mnemonic} address={address} onConfirmed={handleBackupConfirmed} />
        ) : (
          <Logo3D />
        )}
      </div>
      <div className="animate-bounce-in-up animate-delay-1">
        {type === 'new' ? (
          <CreateWalletForm onWalletCreated={handleWalletCreated} />
        ) : type === 'existing' ? (
          <LoginWallet />
        ) : (
          <LoginButton />
        )}
      </div>
    </div>
  );
};

export default LoginPage;
