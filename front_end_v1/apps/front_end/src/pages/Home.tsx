import { Dashboard } from "@/components/dashboard/Dashboard";
import React from "react";
import { useWallet } from "@/hooks/useWallet";
import { TrongDongWatermark } from "@/components/common/TrongDongWatermark";

const Home: React.FC = () => {
  const address = localStorage.getItem("address") || "";
  const { lock } = useWallet();

  const handleDisconnect = () => {
    lock();
    window.location.replace("/login");
  };

  return (
    <div className="relative">
      <TrongDongWatermark />
      <Dashboard
        address={address}
        onDisconnect={handleDisconnect}
      />
    </div>
  );
};

export default Home;
