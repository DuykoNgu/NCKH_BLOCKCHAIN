import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, ExternalLink, TrendingUp, GraduationCap, Shield, Activity, Clock, CheckCircle2, XCircle, Loader2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { adminService, type DashboardStats, type NetworkInfo, type RecentNFT, type RecentTransaction } from "@/services/adminService";
import { useAuth } from "@/hooks/useAuth";

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  verified: { label: "Đã xác thực", icon: CheckCircle2, className: "bg-green-400/10 text-green-400 border-green-400/20" },
  pending: { label: "Đang chờ", icon: Clock, className: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" },
  rejected: { label: "Từ chối", icon: XCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
  revoked: { label: "Đã thu hồi", icon: XCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function DashboardContent() {
  const { address: adminAddress } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [network, setNetwork] = useState<NetworkInfo | null>(null);
  const [recentNfts, setRecentNfts] = useState<RecentNFT[]>([]);
  const [recentTxs, setRecentTxs] = useState<RecentTransaction[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, activitiesRes] = await Promise.all([
          adminService.getStats(),
          adminService.getRecentActivities()
        ]);
        
        setStats(statsRes.stats);
        setNetwork(statsRes.network);
        setRecentNfts(activitiesRes.recent_nfts);
        setRecentTxs(activitiesRes.recent_transactions);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast.error("Không thể tải dữ liệu dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const copyAddress = () => {
    if (adminAddress) {
      navigator.clipboard.writeText(adminAddress);
      toast.success("Đã sao chép địa chỉ ví!");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Tổng NFT phát hành",
      value: stats?.total_nfts ?? 0,
      icon: GraduationCap,
      bgColor: "bg-primary/15",
      iconColor: "text-primary",
      badgeColor: "text-primary bg-primary/10",
      change: "+0%",
    },
    {
      label: "Đã xác thực",
      value: stats?.verified_nfts ?? 0,
      icon: Shield,
      bgColor: "bg-green-400/15",
      iconColor: "text-green-400",
      badgeColor: "text-green-400 bg-green-400/10",
      change: "+0%",
    },
    {
      label: "Yêu cầu chờ duyệt",
      value: stats?.pending_validators ?? 0,
      icon: Clock,
      bgColor: "bg-yellow-400/15",
      iconColor: "text-yellow-400",
      badgeColor: "text-yellow-400 bg-yellow-400/10",
      change: "Mới",
    },
    {
      label: "Giao dịch hôm nay",
      value: stats?.transactions_today ?? 0,
      icon: Activity,
      bgColor: "bg-accent/15",
      iconColor: "text-accent",
      badgeColor: "text-accent bg-accent/10",
      change: "+0%",
    },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header with Greeting and Network Info */}
      <motion.div variants={item}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">Xin chào, Quản trị viên MOET 👋</h2>
            <p className="text-sm text-muted-foreground mt-1">Quản lý bằng đại học NFT trên blockchain</p>
          </div>
          {/* Thông số hệ thống thực tế */}
          <div className="flex items-center gap-3 text-xs bg-secondary/60 border border-border/50 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full ${network?.status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-muted-foreground">Hệ thống:</span>
              <span className="text-foreground font-semibold">EduChain</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Trường học:</span>
              <span className="text-foreground font-semibold">{stats?.total_validators ?? 0}</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Block:</span>
              <span className="text-primary font-mono font-bold">#{stats?.total_blocks ?? 0}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Wallet Header */}
      <motion.div variants={item}>
        <Card className="gradient-border overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Ví quản trị (MOET)</p>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    {adminAddress ? `${adminAddress.slice(0, 10)}...${adminAddress.slice(-6)}` : "Đang tải..."}
                  </h2>
                  <button onClick={copyAddress} className="text-muted-foreground hover:text-primary transition-colors">
                    <Copy className="h-4 w-4" />
                  </button>
                  <button className="text-muted-foreground hover:text-primary transition-colors">
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Trạng thái Node</p>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border font-semibold text-sm ${
                  network?.status === 'active'
                    ? 'bg-green-400/15 border-green-400/30 text-green-400'
                    : 'bg-destructive/15 border-destructive/30 text-destructive'
                }`}>
                  <span className={`h-2 w-2 rounded-full ${
                    network?.status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-destructive'
                  }`} />
                  {network?.status === 'active' ? 'Đang hoạt động' : 'Ngoại tuyến'}
                </div>
                {stats?.latest_block_hash && (
                  <p className="text-[10px] font-mono text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md" title={stats.latest_block_hash}>
                    {stats.latest_block_hash.slice(0, 18)}…
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="glass-card hover:border-primary/30 transition-all hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className={`h-11 w-11 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${stat.badgeColor}`}>
                  <TrendingUp className="h-3 w-3" />
                  {stat.change}
                </span>
              </div>
              <p className="font-display text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1.5 font-medium">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Degrees */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-lg">Bằng cấp NFT gần đây</CardTitle>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  Xem tất cả
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {recentNfts.length > 0 ? recentNfts.map((deg) => {
                  const sc = statusConfig[deg.status] || statusConfig.verified;
                  return (
                    <div key={deg.id} className="flex items-center justify-between px-6 py-3 hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                          <GraduationCap className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{deg.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{deg.degree} • {deg.university}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant="outline" className={sc.className}>
                          <sc.icon className="h-3 w-3 mr-1" />
                          {sc.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground hidden sm:inline">{deg.date}</span>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="p-8 text-center text-muted-foreground">Không có dữ liệu bằng cấp</div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div variants={item}>
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg">Giao dịch gần đây</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentTxs.length > 0 ? recentTxs.map((tx) => (
                <div key={tx.hash} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{tx.type}</p>
                    <p className="text-xs text-muted-foreground">{tx.time}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono text-primary">{tx.hash}</p>
                    <p className="text-xs text-muted-foreground">{tx.gas}</p>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center text-muted-foreground">Không có giao dịch</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

