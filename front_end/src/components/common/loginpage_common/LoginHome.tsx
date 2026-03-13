import { useNavigate } from "react-router-dom";
import { Suspense, lazy } from 'react';
import LoginButton, { WalletIcon } from "@/components/common/loginpage_common/LoginButton";
import { TrongDongWatermark } from "@/components/common/TrongDongWatermark";

const Scene3D = lazy(() => import("@/components/common/Scene3D"));

const LoginHome = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden">
      <TrongDongWatermark opacity={0.04} />
      <Suspense fallback={null}>
        <Scene3D />
      </Suspense>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="glass-card rounded-2xl p-10 shadow-[0_8px_40px_-12px_hsla(0,0%,0%,0.08)]">
          <div className="flex flex-col items-center">
            <WalletIcon />

            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground mb-2">
              EduChain Wallet
            </h1>
            <p className="text-sm text-muted-foreground mb-12 text-center max-w-[280px]">
              Ví blockchain phi tập trung cho Giáo dục
            </p>

            <LoginButton 
              onCreateWallet={() => navigate('/login/new')} 
              onImportWallet={() => navigate('/login/existing')} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginHome;
