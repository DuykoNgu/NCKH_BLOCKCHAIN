import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Fingerprint, Globe, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { NFTService } from "@/services/nftService";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, scale: 0.95, y: 15 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
} as any;

export const DashboardStats = () => {
  const { isUser, isValidator, isAdmin, fullName, address } = useAuth();
  const [nftCount, setNftCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!address) return;

        if (isUser) {
          const res = await NFTService.getUserNFTs(address);
          setNftCount(res.total || res.nfts?.length || 0);
        } else {
          const res = await NFTService.getAllNFTs();
          if (isAdmin) {
            setNftCount(res.total || res.nfts?.length || 0);
          } else if (isValidator) {
            const owned = (res.nfts || []).filter(
              (n) => n.metadata?.institution_address?.toLowerCase() === address.toLowerCase()
            );
            setNftCount(owned.length);
          }
        }
      } catch (e) {
        console.error("Failed to fetch dashboard stats", e);
      }
    };

    fetchStats();
  }, [isUser, isValidator, isAdmin, address]);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
    >
      {/* Identity Card */}
      <motion.div variants={item}>
        <Card className="glass-card overflow-hidden relative group h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                <Fingerprint className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                Đã xác thực
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">
                {isAdmin ? "Quản trị viên" : isValidator ? "Đơn vị cấp phát (Trường học)" : "Sinh viên"}
              </p>
              <h4 className="text-lg font-bold font-display text-foreground truncate">
                {fullName || 
                  (isValidator 
                    ? "Tổ chức / Trường học" 
                    : isAdmin 
                      ? "Bộ Giáo dục & Đào tạo" 
                      : "Tài khoản cá nhân")}
              </h4>
              <div className="mt-3 p-2 bg-secondary/30 rounded-lg border border-border/20">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Địa chỉ cá nhân:</p>
                <code className="text-[11px] text-primary font-mono break-all leading-tight">
                  {address}
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Status Card */}
      <motion.div variants={item}>
        <Card className="glass-card overflow-hidden relative group h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-green-500/20 text-green-500 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="flex items-center gap-1.5 text-xs font-medium text-green-500">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Hoạt động
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">Trạng thái hệ thống</p>
              <h4 className="text-lg font-bold font-display text-foreground">Đang kết nối</h4>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Role Card */}
      <motion.div variants={item}>
        <Card className="glass-card overflow-hidden relative group h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-purple-500/20 text-purple-500 flex items-center justify-center">
                <Globe className="h-5 w-5" />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">Quyền hạn</p>
              <h4 className="text-lg font-bold font-display text-foreground">
                {isAdmin
                  ? "Quản lý toàn hệ thống"
                  : isValidator
                  ? "Cấp phát bằng cấp"
                  : "Xem & chia sẻ bằng cấp"}
              </h4>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Certificate Analytics Card */}
      <motion.div variants={item}>
        <Card className="glass-card overflow-hidden relative group h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
                <Award className="h-5 w-5" />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">
                {isUser
                  ? "Bằng cấp của tôi"
                  : isAdmin
                  ? "Tổng bằng cấp trong hệ thống"
                  : "Bằng cấp đã cấp phát"}
              </p>
              <h4 className="text-xl font-bold font-display text-foreground">
                {nftCount === null ? "..." : `${nftCount} văn bằng`}
              </h4>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};
