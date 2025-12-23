import { Wallet, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"


export const Header = () => {
  const navigate = useNavigate();

  const handleDeleteRole = () => {
    localStorage.removeItem("role");
    localStorage.setItem("isLoggedIn", "false");
    navigate("/login", { replace: true });
  };

  return (
      <header className="border-b border-border/50 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl from-accent to-primary flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">CryptoVault</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-800 animate-pulse"></span>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Đã kết nối
            </span>
            <Button variant="outline" size="sm" onClick={handleDeleteRole}>
              <LogOut className="w-4 h-4 mr-2" />
              Xóa Role
            </Button>
          </div>
        </div>
      </header>
  );
};
