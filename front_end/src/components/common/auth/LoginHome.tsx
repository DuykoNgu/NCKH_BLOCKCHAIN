import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import LoginButton, { WalletIcon } from "@/components/common/auth/LoginButton";

const LoginHome = () => {
  const navigate = useNavigate();

  return (
    <div className="glass-card rounded-2xl p-10 shadow-[0_8px_40px_-12px_hsla(0,0%,0%,0.08)]">
      <div className="flex flex-col items-center">
        <WalletIcon />

        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground mb-2">
          EduChain ID
        </h1>
        <p className="text-sm text-muted-foreground mb-12 text-center max-w-[280px]">
          Hệ thống định danh và lưu trữ chứng chỉ số
        </p>

        <div className="space-y-6 w-full">
          <LoginButton
            onImportWallet={() => navigate('/login?type=import')}
            onCreateWallet={() => navigate('/login?type=create')}
            onRegisterSchool={() => navigate('/login?type=school')}
          />

          <div className="w-full mt-8 pt-6 border-t border-border/50 space-y-4">
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50"></span>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-semibold">
                <span className="bg-background/50 px-2 text-muted-foreground backdrop-blur-sm">Hoặc</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/verify')}
              className="w-full h-12 rounded-xl border border-border/50 bg-secondary/30 hover:bg-secondary/50 flex items-center justify-center gap-2 text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] group"
            >
              <Search className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
              <span>Tra cứu & Xác minh văn bằng</span>
            </button>

            <div className="text-center pt-2">
              <button
                onClick={() => navigate('/moet-login')}
                className="text-xs text-muted-foreground hover:text-primary transition-colors italic"
              >
                Bạn là Quản trị viên MOET? Đăng nhập tại đây
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginHome;
