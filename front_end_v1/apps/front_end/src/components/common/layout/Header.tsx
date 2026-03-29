import { ShieldCheck, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

export const Header = () => {
  return (
    <header className="border-b border-border/50 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">EduChain</span>
          </div>

          <Button asChild variant="ghost" size="sm" className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <a href="http://localhost:8080" target="_blank" rel="noopener noreferrer">
              <Info className="w-4 h-4" />
              Giới thiệu dự án
            </a>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Hệ thống trực tuyến
          </span>
        </div>
      </div>
    </header>
  );
};
