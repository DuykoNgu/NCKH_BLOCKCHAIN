import { Dashboard } from "@/components/common/layout/Dashboard";
import React from "react";
import { logoutUser } from "@/services/authService";
import { TrongDongWatermark } from "@/components/common/TrongDongWatermark";

const Home: React.FC = () => {
  const address = localStorage.getItem("address") || "";
  const balance = "0.0000"; // mock
  const chainId = "1"; // mock

  const handleDisconnect = () => {
    logoutUser();
    window.location.replace("/login");
  };

  return (
    <div className="relative">
      <TrongDongWatermark />
      <Dashboard
        address={address}
        balance={balance}
        chainId={chainId}
        onDisconnect={handleDisconnect}
      />
    </div>
  );
};

export default Home;
