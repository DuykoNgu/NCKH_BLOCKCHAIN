import { motion } from "framer-motion";
import { Network, Server, Activity, Clock, CheckCircle2, XCircle, AlertCircle, Zap, HardDrive, Wifi } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { nodes, networkStats, syncHistory } from "@/data/admin/mockData";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  active: { label: "Hoạt động", icon: CheckCircle2, className: "bg-green-400/10 text-green-400 border-green-400/20" },
  maintenance: { label: "Bảo trì", icon: AlertCircle, className: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" },
  inactive: { label: "Ngừng hoạt động", icon: XCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
};

// Icon component map
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Server,
  Activity,
  Clock,
};

export default function NetworkPage() {
  const activeNodes = nodes.filter(n => n.status === "active").length;
  const syncProgress = (nodes[0].blockNumber / 19412847) * 100;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
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
                  <p className="text-xs sm:text-sm text-muted-foreground">Theo dõi và quản lý các node trong mạng lưới blockchain</p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <div className="h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs sm:text-sm text-green-400 font-medium">Ethereum Mainnet</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Network Stats */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {networkStats.map((stat) => {
          const IconComponent = iconMap[stat.icon] || Server;
          return (
            <Card key={stat.label} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`h-10 w-10 rounded-lg bg-secondary flex items-center justify-center ${stat.color}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                </div>
                <p className="font-display text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Nodes List */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Server className="h-4 w-4 text-primary" />
                  Danh sách Node
                </CardTitle>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  {activeNodes}/{nodes.length} đang hoạt động
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {nodes.map((node) => {
                  const sc = statusConfig[node.status];
                  return (
                    <div key={node.id} className="flex items-center justify-between px-6 py-4 hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          node.status === 'active' ? 'bg-green-400/20' : 'bg-yellow-400/20'
                        }`}>
                          <Server className={`h-5 w-5 ${node.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{node.name}</p>
                          <p className="text-xs text-muted-foreground">{node.type} • Latency: {node.latency}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-muted-foreground">Block</p>
                          <p className="text-xs font-mono text-primary">#{node.blockNumber.toLocaleString()}</p>
                        </div>
                        <div className="text-right hidden md:block">
                          <p className="text-xs text-muted-foreground">Uptime</p>
                          <p className="text-xs text-green-400">{node.uptime}</p>
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

        {/* Network Status */}
        <motion.div variants={item} className="space-y-4">
          {/* Sync Status */}
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
                  <span className="text-foreground font-medium">{syncProgress.toFixed(1)}%</span>
                </div>
                <Progress value={syncProgress} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-2 mb-1">
                    <HardDrive className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Block Height</span>
                  </div>
                  <p className="text-sm font-mono font-bold text-foreground">#19,412,847</p>
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

          {/* Sync History */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Lịch sử đồng bộ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {syncHistory.map((sync, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                    <span className="text-muted-foreground">{sync.time}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-primary">{sync.block}</span>
                    <span className="text-muted-foreground">{sync.txCount} tx</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
