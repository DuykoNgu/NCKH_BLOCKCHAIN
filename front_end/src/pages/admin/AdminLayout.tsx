import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/AppSidebar";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background relative overflow-hidden">
        {/* Background Mesh Gradients */}
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-[10%] left-[20%] w-[40%] h-[40%] rounded-full bg-primary/3 blur-[120px] pointer-events-none" />

        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          <header className="h-16 flex items-center justify-between border-b border-primary/5 px-6 bg-background/50 backdrop-blur-md sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-primary/10 hover:text-primary transition-colors" />
              <div className="h-6 w-px bg-border/50 hidden sm:block" />
              <h1 className="font-display text-base font-bold text-foreground hidden sm:block tracking-tight">Hệ thống Quản trị</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center bg-secondary/50 rounded-full px-3 py-1.5 border border-border/50 focus-within:border-primary/50 transition-all">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm..." 
                  className="bg-transparent border-none outline-none text-xs px-2 w-32 lg:w-48 placeholder:text-muted-foreground/50"
                />
              </div>

              <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary border-2 border-background" />
              </Button>
              
              <div className="h-10 w-px bg-border/50 mx-1" />
              
              <div className="flex items-center gap-3 pl-2 group cursor-pointer">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-black text-foreground leading-none">Admin User</p>
                  <p className="text-[10px] text-primary font-bold mt-1 uppercase tracking-wider">EduChain MOET</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm shadow-primary/10">
                  <span className="text-xs font-black">AD</span>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 sm:p-10 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
