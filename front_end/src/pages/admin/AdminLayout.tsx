import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/AppSidebar";
import { Bell, Search, CheckCircle2, Clock, AlertTriangle, User as UserIcon, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Outlet, useNavigate } from "react-router-dom";
import { Suspense } from "react";
import { AdminPageSkeleton } from "@/components/admin/AdminPageSkeleton";
import { adminLogout } from "@/services/authService";

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    adminLogout();
    navigate('/login');
  };

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

            <div className="flex items-center gap-2">
              {/* Search Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl">
                    <Search className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md glass-card top-[20%] translate-y-0 border-none shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="font-display font-bold">Tìm kiếm trong hệ thống</DialogTitle>
                  </DialogHeader>
                  <div className="flex items-center space-x-2 pt-4">
                    <Search className="h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Tìm kiếm chứng chỉ, đối tác, block hash..." className="flex-1 border-none focus-visible:ring-0 text-lg bg-transparent" />
                  </div>
                </DialogContent>
              </Dialog>

              {/* Notification Sheet */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl relative">
                    <Bell className="h-4 w-4" />
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary border-2 border-background animate-pulse" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="glass-card w-[400px] sm:w-[540px] border-l border-primary/5">
                  <SheetHeader className="mb-6">
                    <SheetTitle className="font-display font-bold text-2xl">Thông báo</SheetTitle>
                    <SheetDescription>Bạn có 3 thông báo mới chưa đọc từ hệ thống.</SheetDescription>
                  </SheetHeader>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-primary/[0.03] border border-primary/5 hover:bg-primary/[0.05] transition-all cursor-pointer">
                      <div className="mt-1 bg-green-500/10 p-2 rounded-xl"><CheckCircle2 className="h-4 w-4 text-green-500" /></div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">Đối tác đã được duyệt</h4>
                        <p className="text-sm text-muted-foreground mt-1">Trường ĐH Bách Khoa HCM đã tham gia mạng lưới thành công.</p>
                        <p className="text-[10px] font-black text-muted-foreground/50 mt-2 uppercase tracking-wider">10 phút trước</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-secondary/30 transition-all cursor-pointer border border-transparent hover:border-border/50">
                      <div className="mt-1 bg-blue-500/10 p-2 rounded-xl"><Clock className="h-4 w-4 text-blue-500" /></div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">Yêu cầu tham gia mới</h4>
                        <p className="text-sm text-muted-foreground mt-1">ĐH Công nghệ Thông tin vừa gửi yêu cầu cấp quyền đối tác.</p>
                        <p className="text-[10px] font-black text-muted-foreground/50 mt-2 uppercase tracking-wider">1 giờ trước</p>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="h-8 w-px bg-border/50 mx-2" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-3 pl-2 group cursor-pointer outline-none">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-black text-foreground leading-none group-hover:text-primary transition-colors">Admin MOET</p>
                      <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-wider">Bộ Giáo dục & Đào tạo</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm shadow-primary/10">
                      <span className="text-xs font-black">AD</span>
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 glass-card border-none shadow-2xl mt-2 p-2">
                  <DropdownMenuLabel className="font-display font-bold px-3 py-2">Tài khoản Quản trị</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-primary/5" />
                  <DropdownMenuItem className="cursor-pointer gap-3 rounded-xl p-3 focus:bg-primary/10 focus:text-primary transition-all">
                    <UserIcon className="h-4 w-4" />
                    <span className="font-medium">Thông tin cá nhân</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-3 rounded-xl p-3 focus:bg-primary/10 focus:text-primary transition-all">
                    <Settings className="h-4 w-4" />
                    <span className="font-medium">Cài đặt hệ thống</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-primary/5" />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="cursor-pointer gap-3 rounded-xl p-3 text-destructive focus:bg-destructive/10 focus:text-destructive transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="font-bold">Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-6 sm:p-10 overflow-auto">
            <Suspense fallback={<AdminPageSkeleton />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
