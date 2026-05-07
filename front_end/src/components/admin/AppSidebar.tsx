import {
  LayoutDashboard,
  GraduationCap,
  Shield,
  Activity,
  Settings,
  Blocks,
  Users,
  Network,
  LogOut,
  PlusCircle,
} from "lucide-react";
import { NavLink } from "@/components/admin/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { adminLogout } from "@/services/authService";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { hasRoutePermission } from "@/constants/permissions";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const { state } = useSidebar();
  const { role } = useAuth();
  const navigate = useNavigate();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // Danh sách tất cả menu items tiềm năng
  const allMenuItems = {
    main: [
      { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
      { title: "Cấp phát Bằng", url: "/admin/degrees", icon: PlusCircle, roles: ["validator"] },
      { title: "Tất cả Bằng cấp", url: "/admin/degrees", icon: GraduationCap, roles: ["moet", "admin"] },
      { title: "Bằng cấp của tôi", url: "/admin/degrees", icon: GraduationCap, roles: ["client"] },
      { title: "Bằng đã cấp", url: "/admin/my-degrees", icon: GraduationCap, roles: ["validator"] },
      { title: "Xác thực", url: "/admin/verify", icon: Shield },
      { title: "Giao dịch", url: "/admin/transactions", icon: Activity },
    ],
    manage: [
      { title: "Quản lý mạng (Node)", url: "/admin/network", icon: Network },
      { title: "Phê duyệt đối tác", url: "/admin/validators", icon: Shield, roles: ["moet", "admin"] },
      { title: "Quản lý Sinh viên", url: "/admin/students", icon: Users },
      { title: "Cấu hình Hệ thống", url: "/admin/contracts", icon: Blocks },
      { title: "Cài đặt", url: "/admin/settings", icon: Settings },
    ]
  };

  const handleLogout = () => {
    adminLogout(); // Chỉ xoá session, giữ vault để lần sau đăng nhập bằng mật khẩu
    navigate('/moet-login');
  };

  // Lọc menu items dựa trên permissions.ts
  const filterMenu = (items: any[]) => {
    return items.filter(item => {
      // Nếu item có quy định roles cụ thể cho hiển thị
      if (item.roles && !item.roles.map((r: string) => r.toLowerCase()).includes(role?.toLowerCase() || "")) return false;

      // Kiểm tra quyền truy cập route tổng quát
      return hasRoutePermission(role, item.url);
    });
  };

  const menu = {
    main: filterMenu(allMenuItems.main),
    manage: filterMenu(allMenuItems.manage)
  };

  return (
    <Sidebar collapsible="icon" className="z-20 border-r border-primary/5 bg-background/50 backdrop-blur-xl">
      <SidebarHeader className={collapsed ? "p-0 py-4 flex items-center justify-center" : "p-6"}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-4"}`}>
          <div className={`${collapsed ? "h-8 w-8" : "h-10 w-10"} rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0 transition-all duration-300`}>
            <Blocks className={`${collapsed ? "h-5 w-5" : "h-6 w-6"} text-primary-foreground`} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h2 className="font-display text-base font-black text-foreground truncate tracking-tight">EduChain Vault</h2>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                <p className="text-[9px] text-primary font-black uppercase tracking-widest">
                  {role || "Guest"}
                </p>
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className={`no-scrollbar ${collapsed ? "px-0" : "px-3"}`}>
        <SidebarGroup className={collapsed ? "p-2" : ""}>
          {!collapsed && <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">Tổng quan</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {menu.main.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} className={`h-11 rounded-xl transition-all duration-300 ${collapsed ? "px-0 justify-center group-data-[collapsible=icon]:!p-0" : "px-4"}`}>
                    <NavLink to={item.url} end activeClassName="bg-primary text-primary-foreground shadow-lg shadow-primary/20" className={collapsed ? "justify-center w-full" : ""}>
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span className="font-semibold tracking-tight">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {menu.manage.length > 0 && (
          <SidebarGroup className={`mt-4 ${collapsed ? "p-2" : ""}`}>
            {!collapsed && <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">Quản lý</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {menu.manage.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} className={`h-11 rounded-xl transition-all duration-300 ${collapsed ? "px-0 justify-center group-data-[collapsible=icon]:!p-0" : "px-4"}`}>
                      <NavLink to={item.url} end activeClassName="bg-primary text-primary-foreground shadow-lg shadow-primary/20" className={collapsed ? "justify-center w-full" : ""}>
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && <span className="font-semibold tracking-tight">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className={collapsed ? "p-0 py-4 flex items-center justify-center" : "p-6"}>
        {!collapsed && (
          <div className="relative overflow-hidden rounded-2xl bg-secondary/50 p-4 border border-border/50 group">
            <div className="absolute -right-4 -bottom-4 h-12 w-12 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-colors" />
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <div className="absolute inset-0 h-2 w-2 rounded-full bg-green-500 animate-ping opacity-75" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-foreground/70">Mạng lưới P2P</p>
                <p className="text-[10px] text-muted-foreground">Sẵn sàng hoạt động</p>
              </div>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className={`h-11 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ${collapsed ? "w-11 px-0 justify-center" : "w-full px-4 mt-4 justify-start gap-3"}`}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="font-semibold">Đăng xuất</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
