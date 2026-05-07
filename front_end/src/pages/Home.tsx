import { Dashboard } from "@/components/common/layout/Dashboard";
import { PendingState } from "@/components/common/layout/PendingState";
import { PageTransition } from "@/components/common/layout/PageTransition";
import React from "react";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/hooks/useAuth";
import { TrongDongWatermark } from "@/components/common/TrongDongWatermark";

const Home: React.FC = () => {
  const { isPendingApproval, isAdmin } = useAuth();
  const address = localStorage.getItem("address") || "";
  const { lock } = useWallet();

  React.useEffect(() => {
    if (isAdmin) {
      window.location.replace("/admin");
    }
  }, [isAdmin]);

  const handleDisconnect = () => {
    lock();
    window.location.replace("/login");
  };

  if (isPendingApproval) {
    return (
      <PageTransition>
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
          <TrongDongWatermark />
          <div className="z-10 w-full">
            <PendingState onLogout={handleDisconnect} />
          </div>
        </div>
      </PageTransition>
    );
  }

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
