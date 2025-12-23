import { Dashboard } from "@/components/common/home_common/Dashboard";
import React from "react";
import { logoutUser } from "@/services/authService";

const Home: React.FC = () => {
  const address = localStorage.getItem("address") || "";
  const balance = "0.0000"; // mock
  const chainId = "1"; // mock

  const handleDisconnect = () => {
    logoutUser();
    window.location.replace("/login");
  };

  return (
    <div>
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
