import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/AppSidebar";
import { Bell, Search, CheckCircle2, Clock, AlertTriangle, User as UserIcon, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Outlet } from "react-router-dom";

export default function Layout() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h1 className="font-display text-lg font-semibold text-foreground hidden sm:block">EduChain Vault</h1>
            </div>
            <div className="flex items-center gap-2">
              {/* Search Dialog */}
              <Dialog>
                <DialogTrigger className="h-9 w-9 inline-flex flex-shrink-0 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground focus-visible:outline-none">
                  <Search className="h-4 w-4" />
                </DialogTrigger>
                <DialogContent className="sm:max-w-md glass-card top-[20%] translate-y-0">
                  <DialogHeader>
                    <DialogTitle>Tìm kiếm trong hệ thống</DialogTitle>
                  </DialogHeader>
                  <div className="flex items-center space-x-2 pt-4">
                    <Search className="h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Tìm kiếm chứng chỉ, validator, block hash..." className="flex-1 border-none focus-visible:ring-0 text-lg bg-transparent" />
                  </div>
                </DialogContent>
              </Dialog>

              {/* Notification Sheet */}
              <Sheet>
                <SheetTrigger className="h-9 w-9 inline-flex flex-shrink-0 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground focus-visible:outline-none relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
                </SheetTrigger>
                <SheetContent className="glass-card w-[400px] sm:w-[540px]">
                  <SheetHeader className="mb-6">
                    <SheetTitle>Thông báo hệ thống</SheetTitle>
                    <SheetDescription>Bạn có 3 thông báo mới chưa đọc.</SheetDescription>
                  </SheetHeader>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-3 rounded-lg bg-secondary/50 border border-border">
                      <div className="mt-1 bg-green-500/20 p-2 rounded-full"><CheckCircle2 className="h-4 w-4 text-green-500" /></div>
                      <div>
                        <h4 className="text-sm font-semibold">Validator đã được duyệt</h4>
                        <p className="text-sm text-muted-foreground mt-1">Trường ĐH Bách Khoa HCM đã tham gia mạng lưới thành công.</p>
                        <p className="text-xs text-muted-foreground mt-2">10 phút trước</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-secondary/30 transition-colors">
                      <div className="mt-1 bg-blue-500/20 p-2 rounded-full"><Clock className="h-4 w-4 text-blue-500" /></div>
                      <div>
                        <h4 className="text-sm font-semibold">Yêu cầu tham gia mới</h4>
                        <p className="text-sm text-muted-foreground mt-1">ĐH Công nghệ Thông tin vừa gửi yêu cầu cấp quyền Validator.</p>
                        <p className="text-xs text-muted-foreground mt-2">1 giờ trước</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-secondary/30 transition-colors">
                      <div className="mt-1 bg-yellow-500/20 p-2 rounded-full"><AlertTriangle className="h-4 w-4 text-yellow-500" /></div>
                      <div>
                        <h4 className="text-sm font-semibold">Cảnh báo tải mạng</h4>
                        <p className="text-sm text-muted-foreground mt-1">Lượng giao dịch tăng vọt. Gas price dự kiến tăng nhẹ.</p>
                        <p className="text-xs text-muted-foreground mt-2">3 giờ trước</p>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <DropdownMenu>
                <DropdownMenuTrigger className="h-8 w-8 relative flex-shrink-0 rounded-full ml-2 border border-primary/30 outline-none hover:ring-2 hover:ring-primary/20 flex items-center justify-center bg-primary/20">
                  <span className="text-xs font-bold text-primary">AD</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass-card">
                  <DropdownMenuLabel>Tài khoản Quản trị</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer gap-2">
                    <UserIcon className="h-4 w-4" />
                    <span>Thông tin cá nhân</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Cài đặt hệ thống</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer gap-2 text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
