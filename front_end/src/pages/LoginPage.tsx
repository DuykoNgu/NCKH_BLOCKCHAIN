import React from "react";
import { useParams } from "react-router-dom";
import Logo3D from "@/components/common/loginpage_common/Logo3D";
import LoginButton from "@/components/common/loginpage_common/LoginButton";
import CreateWalletForm from "@/components/common/loginpage_common/CreateWalletForm";
import LoginWallet from "@/components/common/loginpage_common/LoginWallet";

const LoginPage: React.FC = () => {
  const { type } = useParams<{ type?: string }>();

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800 animate-gradient flex flex-col items-center justify-center">
      <div className="animate-bounce-in-up">
        <Logo3D />
      </div>
      <div className="animate-bounce-in-up animate-delay-1">
        {type === 'new' ? <CreateWalletForm /> : type === 'existing' ? <LoginWallet /> : <LoginButton />}
      </div>
    </div>
  );
};

export default LoginPage;
