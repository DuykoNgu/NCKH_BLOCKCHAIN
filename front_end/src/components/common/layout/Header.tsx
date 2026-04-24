import { ShieldCheck, User as UserIcon, LogOut } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useNavigate } from "react-router-dom"
import { logoutUser } from "@/services/authService"

export const Header = () => {
  const { fullName, role, isAdmin, isValidator } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };
  
  return (
    <header className="border-b border-border/50 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/home')}>
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-gradient block leading-none mb-1">EduChain</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Blockchain Verify</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end border-r border-border/50 pr-4">
            <span className="text-sm font-bold text-foreground">
              {fullName || (isAdmin ? "Bộ Giáo dục & Đào tạo" : "Tài khoản của tôi")}
            </span>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-primary">
              Role: {role}
            </span>
          </div>
          {(isValidator || isAdmin) && (
            <button 
              onClick={() => navigate('/admin')}
              className="hidden sm:flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-xl border border-primary/20 transition-all font-semibold text-xs"
            >
              Trang quản trị
            </button>
          )}

          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-secondary/50 hover:bg-destructive/10 text-muted-foreground hover:text-destructive px-3 py-1.5 rounded-xl border border-border/50 transition-all group"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            <span className="text-xs font-semibold">Đăng xuất</span>
          </button>
        </div>
      </div>
    </header>
  );
};
