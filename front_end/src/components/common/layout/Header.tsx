import { ShieldCheck, Info, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

export const Header = () => {
  const { isAdmin } = useAuth();

  return (
    <header className="border-b border-border/50 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-gradient block leading-none mb-1">EduChain</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Blockchain Verify</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <a href="http://localhost:8080" target="_blank" rel="noopener noreferrer">
                <Info className="w-4 h-4" />
                Giới thiệu dự án
              </a>
            </Button>

            {isAdmin && (
              <Button asChild variant="ghost" size="sm" className="flex items-center gap-2 text-primary hover:bg-primary/10 transition-colors">
                <Link to="/admin">
                  <LayoutDashboard className="w-4 h-4" />
                  Quản trị hệ thống
                </Link>
              </Button>
            )}
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
          
          <div className="flex items-center gap-2 bg-secondary/30 px-3 py-1.5 rounded-full border border-border/50">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
            <span className="text-xs font-medium text-foreground">
              Online
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
