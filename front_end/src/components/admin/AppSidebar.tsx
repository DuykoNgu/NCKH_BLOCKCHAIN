import {
  LayoutDashboard,
  GraduationCap,
  Shield,
  Activity,
  Settings,
  Blocks,
  Users,
  Network,
  PlusCircle,
} from "lucide-react";
import { NavLink } from "@/components/admin/NavLink";
import { useLocation } from "react-router-dom";
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
import { useAuth } from "@/hooks/useAuth";
import { hasRoutePermission } from "@/constants/permissions";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { role } = useAuth();


  const isActive = (path: string) => location.pathname === path;

  // Danh sách tất cả menu items tiềm năng
  const allMenuItems = {
    main: [
      { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
      { title: "Cấp phát Bằng", url: "/admin/degrees", icon: PlusCircle, roles: ["validator"] }, // Chỉ hiện Plus icon cho validator
      { title: "Tất cả Bằng cấp", url: "/admin/degrees", icon: GraduationCap, roles: ["moet", "admin"] },
      { title: "Bằng cấp của tôi", url: "/admin/degrees", icon: GraduationCap, roles: ["client"] },
      { title: "Bằng đã cấp", url: "/admin/my-degrees", icon: GraduationCap, roles: ["validator"] },
      { title: "Xác thực", url: "/admin/verify", icon: Shield },
      { title: "Giao dịch", url: "/admin/transactions", icon: Activity },
    ],
    manage: [
      { title: "Quản lý mạng (Node)", url: "/admin/network", icon: Network },
      { title: "Quản lý Sinh viên", url: "/admin/students", icon: Users },
      { title: "Cấu hình Hệ thống", url: "/admin/contracts", icon: Blocks },
      { title: "Cài đặt", url: "/admin/settings", icon: Settings },
    ]
  };

  // Lọc menu items dựa trên permissions.ts
  const filterMenu = (items: any[]) => {
    return items.filter(item => {
      // Nếu item có quy định roles cụ thể cho hiển thị
      if (item.roles && !item.roles.includes(role || "")) return false;
      
      // Kiểm tra quyền truy cập route tổng quát
      return hasRoutePermission(role, item.url);
    });
  };

  const menu = {
    main: filterMenu(allMenuItems.main),
    manage: filterMenu(allMenuItems.manage)
  };

  return (
    <Sidebar collapsible="icon" className="z-20">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center glow-effect shrink-0">
            <Blocks className="h-5 w-5 text-primary" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-display text-sm font-bold text-foreground">EduChain Vault</h2>
              <p className="text-[10px] text-primary font-mono uppercase tracking-wider">
                Role: {role || "Guest"}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tổng quan</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menu.main.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end activeClassName="bg-sidebar-accent text-primary font-medium">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {menu.manage.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Quản lý</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menu.manage.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url} end activeClassName="bg-sidebar-accent text-primary font-medium">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && (
          <div className="glass-card rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse-glow" />
              <span className="text-xs text-muted-foreground">EduChain P2P • Online</span>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
