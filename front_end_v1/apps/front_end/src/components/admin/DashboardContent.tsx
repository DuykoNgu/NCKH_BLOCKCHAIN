import { motion } from "framer-motion";
import { Copy, ExternalLink, TrendingUp, GraduationCap, Shield, Activity, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { dashboardStats, recentDegrees, recentTransactions, networkInfo, adminWallet } from "@/data/admin/mockData";

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  verified: { label: "Đã xác thực", icon: CheckCircle2, className: "bg-green-400/10 text-green-400 border-green-400/20" },
  pending: { label: "Đang chờ", icon: Clock, className: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" },
  rejected: { label: "Từ chối", icon: XCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
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
  const copyAddress = () => {
    navigator.clipboard.writeText(adminWallet.address);
    toast.success("Đã sao chép địa chỉ ví!");
  };

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
              <span className="text-foreground font-medium">{networkInfo.name}</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Gas:</span>
              <span className="text-foreground font-medium">{networkInfo.gas}</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Block:</span>
              <span className="text-primary font-mono">{networkInfo.block}</span>
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
                <p className="text-sm text-muted-foreground mb-1">Ví quản trị</p>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-semibold text-foreground">{adminWallet.address.slice(0, 10)}...{adminWallet.address.slice(-6)}</h2>
                  <button onClick={copyAddress} className="text-muted-foreground hover:text-primary transition-colors">
                    <Copy className="h-4 w-4" />
                  </button>
                  <button className="text-muted-foreground hover:text-primary transition-colors">
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Số dư</p>
                <p className="font-display text-2xl font-bold gradient-text">{adminWallet.balance}</p>
                <p className="text-sm text-muted-foreground">{adminWallet.balanceUsd}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardStats.map((stat) => (
          <Card key={stat.label} className="glass-card hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`h-9 w-9 rounded-lg bg-secondary flex items-center justify-center ${stat.color}`}>
                  {stat.icon === "GraduationCap" && <GraduationCap className="h-4 w-4" />}
                  {stat.icon === "Shield" && <Shield className="h-4 w-4" />}
                  {stat.icon === "Clock" && <Clock className="h-4 w-4" />}
                  {stat.icon === "Activity" && <Activity className="h-4 w-4" />}
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
                {recentDegrees.map((deg) => {
                  const sc = statusConfig[deg.status];
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
                        <span className="text-xs text-muted-foreground hidden sm:inline">{deg.id}</span>
                      </div>
                    </div>
                  );
                })}
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
              {recentTransactions.map((tx) => (
                <div key={tx.hash} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div>
                    <p className="text-sm font-medium text-foreground">{tx.type}</p>
                    <p className="text-xs text-muted-foreground">{tx.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-primary">{tx.hash}</p>
                    <p className="text-xs text-muted-foreground">{tx.gas}</p>
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
