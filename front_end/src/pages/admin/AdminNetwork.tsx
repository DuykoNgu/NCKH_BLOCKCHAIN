import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Network, Server, Activity, Clock, CheckCircle2, XCircle, AlertCircle, Zap, HardDrive, Wifi, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { adminService, type DashboardStats } from "@/services/adminService";

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  active: { label: "Hoạt động", icon: CheckCircle2, className: "bg-green-400/10 text-green-400 border-green-400/20" },
  maintenance: { label: "Bảo trì", icon: AlertCircle, className: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" },
  inactive: { label: "Ngừng hoạt động", icon: XCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function NetworkPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getStats();
        setStats(data.stats);
      } catch (error) {
        console.error("Failed to fetch network stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const nodes = [
    { id: "node-1", name: "Main Validator Node", type: "Full Node", status: "active", blockNumber: stats?.total_blocks || 0, latency: "12ms", uptime: "99.9%" },
    { id: "node-2", name: "Backup Node 01", type: "Full Node", status: "active", blockNumber: stats?.total_blocks || 0, latency: "45ms", uptime: "98.5%" },
    { id: "node-3", name: "MOET Secondary Node", type: "Archive Node", status: "active", blockNumber: (stats?.total_blocks || 0) - 1, latency: "120ms", uptime: "95.0%" },
  ];

  if (loading) {
    return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <Card className="gradient-border overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <Network className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-lg sm:text-xl font-bold text-foreground">Quản lý mạng</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Theo dõi và quản lý các node trong mạng lưới EduChain</p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <div className="h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs sm:text-sm text-green-400 font-medium">EduChain Mainnet</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tổng số Node", value: "8", icon: Server, color: "text-primary" },
          { label: "Active Validators", value: stats?.total_validators || 0, icon: Activity, color: "text-green-400" },
          { label: "Block Time (Avg)", value: "5.2s", icon: Clock, color: "text-accent" },
          { label: "Network TPS", value: "12.4", icon: Zap, color: "text-yellow-400" },
        ].map((stat) => (
          <Card key={stat.label} className="glass-card">
            <CardContent className="p-4">
              <div className={`h-10 w-10 rounded-lg bg-secondary flex items-center justify-center mb-3 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="font-display text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Server className="h-4 w-4 text-primary" />
                  Danh sách Node
                </CardTitle>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  {nodes.filter(n => n.status === "active").length}/{nodes.length} đang hoạt động
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {nodes.map((node) => {
                  const sc = statusConfig[node.status] || statusConfig.active;
                  return (
                    <div key={node.id} className="flex items-center justify-between px-6 py-4 hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-green-400/20 flex items-center justify-center">
                          <Server className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{node.name}</p>
                          <p className="text-xs text-muted-foreground">{node.type} • Latency: {node.latency}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-muted-foreground">Block</p>
                          <p className="text-xs font-mono text-primary">#{node.blockNumber}</p>
                        </div>
                        <Badge variant="outline" className={sc.className}>
                          <sc.icon className="h-3 w-3 mr-1" />
                          {sc.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} className="space-y-4">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Trạng thái đồng bộ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-muted-foreground">Đồng bộ hóa</span>
                  <span className="text-foreground font-medium">100%</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-2 mb-1">
                    <HardDrive className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Block Height</span>
                  </div>
                  <p className="text-sm font-mono font-bold text-foreground">#{stats?.total_blocks}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Wifi className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Kết nối</span>
                  </div>
                  <p className="text-sm font-bold text-green-400">8 Peers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

