import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import LoginButton, { WalletIcon } from "@/components/common/auth/LoginButton";

const LoginHome = () => {
  const navigate = useNavigate();

  return (
    <div className="relative z-10 w-full max-w-md mx-4">
      <div className="glass-card rounded-2xl p-10 shadow-[0_8px_40px_-12px_hsla(0,0%,0%,0.08)]">
        <div className="flex flex-col items-center">
          <WalletIcon />

          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground mb-2">
            EduChain ID
          </h1>
          <p className="text-sm text-muted-foreground mb-12 text-center max-w-[280px]">
            Hệ thống định danh và lưu trữ chứng chỉ số
          </p>

          <LoginButton 
            onCreateWallet={() => navigate('/login/new')} 
            onImportWallet={() => navigate('/login/existing')} 
            onRegisterSchool={() => navigate('/login/school')}
          />

          <div className="w-full mt-8 pt-8 border-t border-border/50">
            <button 
              onClick={() => navigate('/verify')}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 transition-colors group"
            >
              <Search className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-foreground">Xác minh văn bằng (Công khai)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginHome;
