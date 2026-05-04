import { motion } from "framer-motion";
import { Copy, GraduationCap, Shield, Activity, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
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

  const totalNfts = nfts.length;
  const verifiedNfts = nfts.filter((n) => n.is_valid !== false).length;
  const pendingNfts = totalNfts - verifiedNfts;
  const todayTxCount = transactions.length;

  const dashboardStats = [
    { label: "Tổng NFT phát hành", value: totalNfts.toLocaleString(), icon: "GraduationCap", color: "text-primary" },
    { label: "Đã xác thực", value: verifiedNfts.toLocaleString(), icon: "Shield", color: "text-green-400" },
    { label: "Đang chờ / Đã thu hồi", value: pendingNfts.toLocaleString(), icon: "Clock", color: "text-yellow-400" },
    { label: "Tổng giao dịch", value: todayTxCount.toLocaleString(), icon: "Activity", color: "text-accent" },
  ];

  const recentDegrees = nfts.slice(0, 5).map((nft) => ({
    id: truncateHash(nft.token_id),
    name: nft.metadata?.degree_type || "Chứng chỉ số",
    degree: nft.metadata?.degree_type || "-",
    university: nft.metadata?.institution_address ? truncateHash(nft.metadata.institution_address) : "-",
    date: nft.minted_at ? new Date(nft.minted_at).toLocaleDateString("vi-VN") : "-",
    status: nft.is_valid !== false ? "verified" : "rejected",
  }));

  const recentTxs = transactions.slice(0, 3).map((tx) => ({
    hash: truncateHash(tx.tx_hash || tx.tx_id),
    type: tx.payload?.op === "mint_nft" ? "Mint NFT" : tx.payload?.op || "Giao dịch",
    time: tx.timestamp ? formatTimeAgo(tx.timestamp) : "-",
  }));

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
    { label: "Tổng NFT phát hành", value: stats?.total_nfts || 0, icon: GraduationCap, color: "text-primary", change: "+0%" },
    { label: "Đã xác thực", value: stats?.verified_nfts || 0, icon: Shield, color: "text-green-400", change: "+0%" },
    { label: "Yêu cầu chờ duyệt", value: stats?.pending_validators || 0, icon: Clock, color: "text-yellow-400", change: "Mới" },
    { label: "Giao dịch hôm nay", value: stats?.transactions_today || 0, icon: Activity, color: "text-accent", change: "+0%" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header with Greeting and Network Info */}
      <motion.div variants={item}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">Xin chào, Admin 👋</h2>
            <p className="text-sm text-muted-foreground mt-1">Quản lý bằng đại học NFT trên blockchain</p>
          </div>
          {/* Network Info */}
          <div className="flex items-center gap-4 text-xs bg-secondary/50 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3 text-green-400" />
              <span className="text-muted-foreground">Mạng:</span>
              <span className="text-foreground font-medium">{network?.name}</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Gas:</span>
              <span className="text-foreground font-medium">{network?.gas_price}</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Block:</span>
              <span className="text-primary font-mono">#{stats?.total_blocks}</span>
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
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Trạng thái Node</p>
                <p className="font-display text-2xl font-bold gradient-text">{network?.status === 'active' ? 'Đang hoạt động' : 'Ngoại tuyến'}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]" title={stats?.latest_block_hash}>
                  Lớp băm cuối: {stats?.latest_block_hash.slice(0, 20)}...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="glass-card hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`h-9 w-9 rounded-lg bg-secondary flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change}
                </span>
              </div>
              <p className="font-display text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
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

