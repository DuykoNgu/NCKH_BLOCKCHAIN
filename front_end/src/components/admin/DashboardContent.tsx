import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, GraduationCap, Activity, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { NFTService } from "@/services/nftService";
import { TransactionService } from "@/services/transactionService";
import { BlockService } from "@/services/blockService";
import type { NFT } from "@/services/nftService";
import type { TransactionInfo } from "@/services/transactionService";

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

function formatTimeAgo(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  if (diff < 60) return `${Math.floor(diff)} giây trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

function truncateHash(hash: string, start = 6, end = 4): string {
  if (!hash || hash.length <= start + end) return hash || '-';
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}

export default function DashboardContent() {
  const [loading, setLoading] = useState(true);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);
  const [blockCount, setBlockCount] = useState(0);
  const [latestBlockIndex, setLatestBlockIndex] = useState<string>("-");

  const walletAddress = localStorage.getItem("address") || "";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [nftRes, txRes, blockCountRes, latestBlockRes] = await Promise.allSettled([
          NFTService.getAllNFTs(),
          TransactionService.getAllTransactions(),
          BlockService.countBlocks(),
          BlockService.getLatestBlock(),
        ]);

        if (nftRes.status === "fulfilled") setNfts(nftRes.value.nfts || []);
        if (txRes.status === "fulfilled") setTransactions(txRes.value.transactions || []);
        if (blockCountRes.status === "fulfilled") setBlockCount(blockCountRes.value.total_blocks || 0);
        if (latestBlockRes.status === "fulfilled" && latestBlockRes.value.block) {
          setLatestBlockIndex(`#${latestBlockRes.value.block.index}`);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
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

  const statCards = [
    { label: "Tổng NFT phát hành", value: totalNfts.toLocaleString(), icon: GraduationCap, color: "text-primary" },
    { label: "Đã xác thực", value: verifiedNfts.toLocaleString(), icon: CheckCircle2, color: "text-green-400" },
    { label: "Đang chờ / Đã thu hồi", value: pendingNfts.toLocaleString(), icon: Clock, color: "text-yellow-400" },
    { label: "Tổng giao dịch", value: todayTxCount.toLocaleString(), icon: Activity, color: "text-accent" },
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
    navigator.clipboard.writeText(walletAddress);
    toast.success("Đã sao chép địa chỉ ví!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Đang tải dữ liệu...</span>
      </div>
    );
  }

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
              <span className="text-foreground font-medium">EduChain</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Blocks:</span>
              <span className="text-foreground font-medium">{blockCount}</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Latest:</span>
              <span className="text-primary font-mono">{latestBlockIndex}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Wallet Header */}
      {walletAddress && (
        <motion.div variants={item}>
          <Card className="gradient-border overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ví quản trị</p>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-semibold text-foreground">{walletAddress.slice(0, 10)}...{walletAddress.slice(-6)}</h2>
                    <button onClick={copyAddress} className="text-muted-foreground hover:text-primary transition-colors">
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">NFTs sở hữu</p>
                  <p className="font-display text-2xl font-bold gradient-text">{totalNfts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat: any) => (
          <Card key={stat.label} className="glass-card hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`h-9 w-9 rounded-lg bg-secondary flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
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
              {recentDegrees.length === 0 ? (
                <div className="px-6 py-8 text-center text-muted-foreground text-sm">Chưa có NFT nào được phát hành</div>
              ) : (
                <div className="divide-y divide-border">
                  {recentDegrees.map((deg) => {
                    const sc = statusConfig[deg.status] || statusConfig.pending;
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
                  })}
                </div>
              )}
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
              {recentTxs.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground text-sm">Chưa có giao dịch nào</div>
              ) : (
                recentTxs.map((tx) => (
                  <div key={tx.hash} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div>
                      <p className="text-sm font-medium text-foreground">{tx.type}</p>
                      <p className="text-xs text-muted-foreground">{tx.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono text-primary">{tx.hash}</p>
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

