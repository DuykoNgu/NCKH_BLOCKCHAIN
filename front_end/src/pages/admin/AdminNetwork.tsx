import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Network, Server, Activity, Clock, CheckCircle2, XCircle, AlertCircle, HardDrive, Wifi, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { adminService, type DashboardStats } from "@/services/adminService";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

interface Validator {
  address: string;
  org_name?: string;
  is_active: boolean;
  public_key?: string;
}

export default function NetworkPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [validators, setValidators] = useState<Validator[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, validatorsData] = await Promise.all([
        adminService.getStats(),
        adminService.getValidators(true),
      ]);
      setStats(statsData.stats);
      // getPendingValidators trả về cả pending và active — ta dùng tất cả
      const list = validatorsData.data || validatorsData.validators || [];
      setValidators(list);
    } catch (error) {
      console.error("Failed to fetch network data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeValidators = validators.filter((v) => v.is_active);
  const pendingValidators = validators.filter((v) => !v.is_active);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">Quản lý Mạng lưới</h2>
            <p className="text-sm text-muted-foreground mt-1">Theo dõi các node validator trong mạng EduChain</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tổng Validator", value: validators.length, icon: Server, color: "text-primary" },
          { label: "Đang hoạt động", value: activeValidators.length, icon: Activity, color: "text-green-400" },
          { label: "Chờ duyệt", value: pendingValidators.length, icon: Clock, color: "text-yellow-400" },
          { label: "Số Block", value: stats?.total_blocks ?? "-", icon: HardDrive, color: "text-accent" },
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
        {/* Validator list */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Server className="h-4 w-4 text-primary" />
                  Danh sách Validator Node
                </CardTitle>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  {activeValidators.length}/{validators.length} đang hoạt động
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {validators.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Server className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">Chưa có validator nào trong hệ thống</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {validators.map((validator) => (
                    <div
                      key={validator.address}
                      className="flex items-center justify-between px-6 py-4 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${validator.is_active ? "bg-green-400/20" : "bg-yellow-400/20"}`}>
                          <Server className={`h-5 w-5 ${validator.is_active ? "text-green-400" : "text-yellow-400"}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {validator.org_name || "Trường Đại học"}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {validator.address.slice(0, 10)}...{validator.address.slice(-8)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        {validator.is_active ? (
                          <Badge variant="outline" className="bg-green-400/10 text-green-400 border-green-400/20">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Hoạt động
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-400/10 text-yellow-400 border-yellow-400/20">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Chờ duyệt
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
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
                <Network className="h-4 w-4 text-primary" />
                Trạng thái hệ thống
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-muted-foreground">Hoạt động</span>
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
                  <p className="text-sm font-mono font-bold text-foreground">#{stats?.total_blocks ?? "—"}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Wifi className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Kết nối</span>
                  </div>
                  <p className="text-sm font-bold text-green-400">{activeValidators.length} node</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Tổng NFT</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">{stats?.total_nfts ?? "—"}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Chờ duyệt</span>
                  </div>
                  <p className={`text-sm font-bold ${pendingValidators.length > 0 ? "text-yellow-400" : "text-foreground"}`}>
                    {pendingValidators.length} validator
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
