import { motion } from "framer-motion";
import { Copy, GraduationCap, Activity, Shield, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminDashboard } from "@/hooks";
import { NFT_STATUS_CONFIG } from "@/constants/ui";
import { DashboardSkeleton } from "./AdminSkeletons";
import ChainHistoryModal from "./ChainHistoryModal";
import { useState } from "react";
import { toast } from "sonner";


const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function DashboardContent() {
  const {
    isLoading,
    nftListQuery,
    txListQuery,
    walletAddress,
    blockCount,
    latestBlockIndex,
    totalNfts,
    verifiedNfts,
    pendingNfts,
    totalTxs,
    recentDegrees,
    recentTxs,
    copyAddress
  } = useAdminDashboard();

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Still show a basic skeleton if everything is loading at once (initial mount)
  if (isLoading && !nftListQuery.data && !txListQuery.data) return <DashboardSkeleton />;

  const statCards = [
    {
      label: "Tổng NFT phát hành",
      value: totalNfts,
      icon: GraduationCap,
      bgColor: "bg-primary/15",
      iconColor: "text-primary",
      badgeColor: "text-primary bg-primary/10",
      change: "+0%",
    },
    {
      label: "Đã xác thực",
      value: verifiedNfts,
      icon: Shield,
      bgColor: "bg-green-400/15",
      iconColor: "text-green-400",
      badgeColor: "text-green-400 bg-green-400/10",
      change: "+0%",
    },
    {
      label: "Yêu cầu chờ duyệt",
      value: pendingNfts,
      icon: Clock,
      bgColor: "bg-yellow-400/15",
      iconColor: "text-yellow-400",
      badgeColor: "text-yellow-400 bg-yellow-400/10",
      change: "Mới",
    },
    {
      label: "Giao dịch hôm nay",
      value: totalTxs,
      icon: Activity,
      bgColor: "bg-accent/15",
      iconColor: "text-accent",
      badgeColor: "text-accent bg-accent/10",
      change: "+0%",
    },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* Chain History Modal */}
      <ChainHistoryModal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
      />
      
      {/* Header with Greeting and Network Info */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Badge variant="outline" className="mb-2 px-3 py-1 bg-primary/5 text-primary border-primary/20 animate-pulse-glow">
            Hệ thống đang hoạt động
          </Badge>
          <h2 className="font-display text-4xl font-extrabold tracking-tight text-foreground">
            Xin chào, <span className="text-foreground">Quản trị viên MOET</span> 👋
          </h2>
          <p className="text-muted-foreground mt-2 max-w-md text-sm">
            Quản lý bằng đại học NFT trên blockchain. Dưới đây là tóm tắt tình trạng mạng lưới và các giao dịch gần đây.
          </p>
        </div>
        
        {/* Network Info Floating Card */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 p-2 pr-6 bg-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(59,130,246,0.1)] transition-all duration-500 group">
           <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
             <Activity className="h-7 w-7" />
           </div>
           <div className="flex flex-wrap items-center gap-6 sm:gap-10">
             <div className="flex flex-col">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-1 group-hover:text-blue-500 transition-colors">Mạng lưới</p>
               <p className="text-sm font-bold text-slate-900">EduChain</p>
             </div>
             <div className="hidden sm:block h-10 w-px bg-slate-100" />
             <div className="flex flex-col">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-1">Tổng Blocks</p>
               <div className="flex items-center gap-2">
                 <p className="text-sm font-black text-slate-900 font-mono">{(blockCount || 0).toLocaleString()}</p>
                 <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
               </div>
             </div>
             <div className="hidden sm:block h-10 w-px bg-slate-100" />
             <div className="flex flex-col">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-1">Latest Index</p>
               <p className="text-sm font-black font-mono text-blue-600">
                 {latestBlockIndex === "-" ? "# -" : latestBlockIndex}
               </p>
             </div>
           </div>
        </div>
      </motion.div>

      {/* Wallet Header - Redesigned as a Premium Banner */}
      <motion.div variants={item}>
        {walletAddress && (
          <div className="relative overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground shadow-2xl shadow-primary/20">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
            
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-medium">
                  <GraduationCap className="h-3 w-3" />
                  Hệ thống Quản trị MOET
                </div>
                <div>
                  <p className="text-primary-foreground/70 text-sm mb-1">Địa chỉ ví quản trị</p>
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl md:text-3xl font-mono font-bold tracking-tight">
                      {walletAddress.slice(0, 12)}...{walletAddress.slice(-8)}
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        copyAddress();
                        toast.success("Đã sao chép địa chỉ ví!");
                      }}
                      className="rounded-full bg-white/10 hover:bg-white/20 text-white"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-8">
                <div className="text-center bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 min-w-[120px]">
                  <p className="text-xs text-primary-foreground/60 mb-1">NFTs Cấp phát</p>
                  <p className="text-4xl font-black">{nftListQuery.isLoading ? "..." : recentDegrees.length}</p>
                </div>
                <div className="text-center bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 min-w-[120px]">
                  <p className="text-xs text-primary-foreground/60 mb-1">Trạng thái</p>
                  <p className="text-4xl font-black">Online</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.label} className="group relative overflow-hidden glass-card border-none shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
            <div className={`absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity`} />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3 duration-500 ${stat.bgColor} bg-opacity-10`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${stat.badgeColor}`}>
                  <TrendingUp className="h-3 w-3" />
                  {stat.change}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-black tracking-tight text-foreground group-hover:gradient-text transition-all">
                   {(nftListQuery.isLoading || txListQuery.isLoading) ? "..." : stat.value}
                </p>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              </div>
              <stat.icon className={`absolute -right-4 -bottom-4 h-24 w-24 opacity-[0.03] group-hover:opacity-[0.06] group-hover:scale-110 transition-all duration-700`} />
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Degrees */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="glass-card border-none shadow-sm h-full">
            <CardHeader className="p-6 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display text-xl font-black">Bằng cấp NFT mới</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Các chứng chỉ vừa được xác thực trên chain</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2">
              {nftListQuery.isLoading ? (
                <div className="p-4 space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                      <div className="h-12 w-12 rounded-xl bg-secondary" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-1/3 bg-secondary rounded" />
                        <div className="h-3 w-1/2 bg-secondary rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentDegrees.length === 0 ? (
                <div className="px-6 py-20 text-center flex flex-col items-center justify-center">
                   <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                     <GraduationCap className="h-8 w-8 text-muted-foreground/30" />
                   </div>
                   <p className="text-sm text-muted-foreground font-medium">Chưa có NFT nào được phát hành</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentDegrees.map((deg: any) => {
                    const status = deg.is_valid === false ? "revoked" : (deg.status || "verified");
                    const sc = NFT_STATUS_CONFIG[status as keyof typeof NFT_STATUS_CONFIG] || NFT_STATUS_CONFIG.pending;
                    return (
                      <div key={deg.id} className="group flex items-center justify-between p-4 rounded-2xl hover:bg-primary/[0.03] transition-all duration-300">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="h-12 w-12 rounded-xl bg-secondary group-hover:bg-primary/10 flex items-center justify-center shrink-0 transition-colors">
                            <GraduationCap className="h-6 w-6 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{deg.name || deg.recipient_name}</p>
                            <p className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">{deg.degree} • {deg.university}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <Badge variant="outline" className={`rounded-full px-3 py-0.5 border-none shadow-sm ${sc.className}`}>
                            <sc.icon className="h-3 w-3 mr-1.5" />
                            <span className="text-[10px] font-black uppercase tracking-wider">{sc.label}</span>
                          </Badge>
                          <span className="text-[10px] font-black text-muted-foreground/50 hidden sm:inline">{deg.date}</span>
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
          <Card className="glass-card border-none shadow-sm h-full">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle className="font-display text-xl font-black">Giao dịch</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-6">
              {txListQuery.isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 w-full bg-secondary/50 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : recentTxs.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center">
                   <Activity className="h-8 w-8 text-muted-foreground/30 mb-3" />
                   <p className="text-sm text-muted-foreground">Chưa có giao dịch nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTxs.map((tx) => (
                    <div key={tx.hash} className="group relative flex items-center justify-between p-4 rounded-2xl bg-secondary/30 hover:bg-primary/5 transition-all duration-300 border border-transparent hover:border-primary/10">
                      <div className="space-y-1">
                        <p className="text-[11px] font-black text-foreground uppercase tracking-widest leading-none">{(tx.type || "TX").replace('_', ' ')}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">{tx.time}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="font-mono text-[9px] bg-background/50 border-none group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          {tx.hash.slice(0, 10)}...
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button 
                variant="ghost" 
                className="w-full mt-6 text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/5 rounded-xl h-12"
                onClick={() => setIsHistoryOpen(true)}
              >
                Xem lịch sử chuỗi
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
