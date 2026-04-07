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
            // Filter by institution address if validator
            const owned = (res.nfts || []).filter((n) => n.metadata?.institution_address?.toLowerCase() === address.toLowerCase());
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
              <p className="text-sm text-muted-foreground font-medium mb-1">Định danh tổ chức</p>
              <h4 className="text-lg font-bold font-display text-foreground truncate">
                {fullName || (isAdmin ? "Quản Trị Viên (MOET)" : isValidator ? "Trường Học (Cấp Phát)" : "Tài Khoản Sinh Viên")}
              </h4>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Network Card */}
      <motion.div variants={item}>
        <Card className="glass-card overflow-hidden relative group h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center">
                <Globe className="h-5 w-5" />
              </div>
              <span className="flex items-center gap-1.5 text-xs font-medium text-blue-500">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Connected
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">Mạng lưới Blockchain</p>
              <h4 className="text-lg font-bold font-display text-foreground">EduChain Mainnet</h4>
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
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">Vai trò hệ thống</p>
              <h4 className="text-lg font-bold font-display text-foreground">
                {isAdmin ? "MOET Admin" : isValidator ? "Trường Học (Cấp Phát)" : "Sinh Viên (Người Nhận)"}
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
                {isUser ? "Chứng chỉ sở hữu" : isAdmin ? "Tổng chứng chỉ toàn mạng" : "Bằng cấp đã phát hành"}
              </p>
              <h4 className="text-xl font-bold font-display text-foreground">
                {nftCount === null ? "..." : nftCount}
              </h4>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};
