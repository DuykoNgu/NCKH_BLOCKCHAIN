import { motion } from "framer-motion";
import { Network, Server, Activity, CheckCircle2, Zap, HardDrive, Wifi } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAdminNetwork } from "@/hooks";
import { NetworkPageSkeleton } from "@/components/admin/AdminSkeletons";
import { PEER_STATUS_CONFIG } from "@/constants/ui";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };


export default function NetworkPage() {
  const {
    loading,
    peers,
    stats,
    slotInfo,
    recentBlocks,
    activePeersCount,
    networkStatsDisplay
  } = useAdminNetwork();

  if (loading) return <NetworkPageSkeleton />;

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
                <div className={`h-2.5 w-2.5 rounded-full ${stats?.is_time_synced ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`} />
                <span className={`text-xs sm:text-sm ${stats?.is_time_synced ? 'text-green-400' : 'text-yellow-400'} font-medium`}>
                  EduChain {stats?.is_time_synced ? "Synced" : "Not Synced"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Network Stats */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {networkStatsDisplay.map((stat) => {
          const IconComponent = stat.icon;
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
        {/* Peers List */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Server className="h-4 w-4 text-primary" />
                  Danh sách Peers
                </CardTitle>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  {activePeersCount}/{peers.length} đang hoạt động
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {peers.length === 0 ? (
                <div className="px-6 py-8 text-center text-muted-foreground text-sm">Chưa có peer nào kết nối</div>
              ) : (
                <div className="divide-y divide-border">
                  {peers.map((peer) => {
                    const sc = PEER_STATUS_CONFIG[peer.status as keyof typeof PEER_STATUS_CONFIG] || PEER_STATUS_CONFIG.PENDING;
                    return (
                      <div key={peer.peer_id} className="flex items-center justify-between px-6 py-4 hover:bg-secondary/30 transition-colors">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            peer.status === 'ACTIVE' ? 'bg-green-400/20' : 'bg-yellow-400/20'
                          }`}>
                            <Server className={`h-5 w-5 ${peer.status === 'ACTIVE' ? 'text-green-400' : 'text-yellow-400'}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">{peer.ip_address}:{peer.port}</p>
                            <p className="text-xs text-muted-foreground">{peer.node_type} • ID: {peer.peer_id.slice(0, 8)}...</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={sc.className}>
                          <sc.icon className="h-3 w-3 mr-1" />
                          {sc.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Sync status */}
        <motion.div variants={item} className="space-y-4">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Consensus PoA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-2 mb-1">
                    <HardDrive className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Current Slot</span>
                  </div>
                  <p className="text-sm font-mono font-bold text-foreground">#{slotInfo?.current_slot || "-"}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Wifi className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Leader</span>
                  </div>
                  <p className="text-sm font-bold text-green-400">Validator #{slotInfo?.leader_index ?? "-"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-secondary/50">
                  <span className="text-xs text-muted-foreground">Slot Duration</span>
                  <p className="text-sm font-bold text-foreground">{slotInfo?.slot_duration || stats?.slot_duration || 5}s</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <span className="text-xs text-muted-foreground">NTP Offset</span>
                  <p className="text-sm font-bold text-foreground">{stats?.ntp_offset?.toFixed(3) || "0.000"}s</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Blocks gần đây
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentBlocks.length === 0 ? (
                <div className="py-4 text-center text-muted-foreground text-sm">Chưa có block nào</div>
              ) : (
                recentBlocks.map((block) => (
                  <div key={block.block_id} className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-400" />
                      <span className="font-mono text-primary">#{block.index}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{block.transactions_count} tx</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
