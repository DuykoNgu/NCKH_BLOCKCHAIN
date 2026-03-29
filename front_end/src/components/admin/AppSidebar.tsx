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

const mainItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Bằng cấp NFT", url: "/admin/degrees", icon: GraduationCap },
  { title: "Xác thực", url: "/admin/verify", icon: Shield },
  { title: "Giao dịch", url: "/admin/transactions", icon: Activity },
];

const manageItems = [
  { title: "Quản lý mạng", url: "/admin/network", icon: Network },
  { title: "Sinh viên", url: "/admin/students", icon: Users },
  { title: "Smart Contract", url: "/admin/contracts", icon: FileCheck },
  { title: "Cài đặt", url: "/admin/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

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
              {mainItems.map((item) => (
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
              {manageItems.map((item) => (
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

      <SidebarFooter className="p-4">
        {!collapsed && (
          <div className="glass-card rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse-glow" />
              <span className="text-xs text-muted-foreground">Mạng Ethereum • Hoạt động</span>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
