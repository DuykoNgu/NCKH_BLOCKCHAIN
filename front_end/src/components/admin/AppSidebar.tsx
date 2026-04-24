import {
  LayoutDashboard,
  GraduationCap,
  Shield,
  Activity,
  Settings,
  Blocks,
  FileCheck,
  Users,
  Network,
  LogOut,
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
import { Button } from "../ui/button";

const mainItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, roles: ["admin", "moet"] },
  { title: "Bằng cấp NFT", url: "/admin/degrees", icon: GraduationCap, roles: ["admin", "moet", "validator"] },
  { title: "Xác thực", url: "/admin/verify", icon: Shield, roles: ["admin", "moet", "validator", "client"] },
  { title: "Giao dịch", url: "/admin/transactions", icon: Activity, roles: ["admin", "moet", "validator"] },
];

const manageItems = [
  { title: "Quản lý mạng", url: "/admin/network", icon: Network, roles: ["admin", "moet"] },
  { title: "Phê duyệt", url: "/admin/validators", icon: FileCheck, roles: ["admin", "moet"] },
  { title: "Sinh viên", url: "/admin/students", icon: Users, roles: ["admin", "moet", "validator"] },
  { title: "Smart Contract", url: "/admin/contracts", icon: FileCheck, roles: ["admin", "moet"] },
  { title: "Cài đặt", url: "/admin/settings", icon: Settings, roles: ["admin", "moet", "validator"] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { role } = useAuth();
  const navigate = useNavigate();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const filteredMainItems = mainItems.filter(item => !item.roles || item.roles.includes(role || ""));
  const filteredManageItems = manageItems.filter(item => !item.roles || item.roles.includes(role || ""));

  const handleLogout = () => {
    adminLogout(); // Chỉ xoá session, giữ vault để lần sau đăng nhập bằng mật khẩu
    navigate('/moet-login');
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
              <p className="text-xs text-muted-foreground">Blockchain Verify</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tổng quan</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMainItems.map((item) => (
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

        <SidebarGroup>
          <SidebarGroupLabel>Quản lý</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredManageItems.map((item) => (
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
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-4">
        {!collapsed && (
          <div className="glass-card rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse-glow" />
              <span className="text-xs text-muted-foreground">Mạng EduChain • Hoạt động</span>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-3"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Đăng xuất</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
