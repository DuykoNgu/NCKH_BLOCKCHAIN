import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Bell, Globe, Key, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { NetworkService } from "@/services/networkService";
import type { NetworkStats } from "@/services/networkService";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<NetworkStats | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000/api/v1";
  const walletAddress = localStorage.getItem("address") || "";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const statsRes = await NetworkService.getNetworkStats();
        setStats(statsRes);
      } catch (err) {
        console.error("Settings fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = () => toast.success("Đã lưu cài đặt!");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Đang tải cài đặt...</span>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-3xl">
      <motion.div variants={item}>
        <h2 className="font-display text-2xl font-bold text-foreground">Cài đặt</h2>
        <p className="text-sm text-muted-foreground mt-1">Cấu hình hệ thống và tùy chỉnh</p>
      </motion.div>

      {/* Network */}
      <motion.div variants={item}>
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg flex items-center gap-2"><Globe className="h-5 w-5 text-primary" />Mạng Blockchain</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Mạng lưới</Label>
              <Input value="EduChain (Private PoA)" disabled />
            </div>
            <div className="space-y-2">
              <Label>Backend API URL</Label>
              <Input value={apiUrl} disabled />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Slot Duration</Label>
                <Input value={`${stats?.slot_duration || 5} giây`} disabled />
              </div>
              <div className="space-y-2">
                <Label>Validators</Label>
                <Input value={stats?.validator_peers?.toString() || "0"} disabled />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>NTP Sync</Label>
                <Input value={stats?.is_time_synced ? "✅ Synced" : "❌ Not Synced"} disabled />
              </div>
              <div className="space-y-2">
                <Label>Whitelist</Label>
                <Input value={stats?.whitelist_enabled ? "Enabled" : "Disabled"} disabled />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Wallet */}
      <motion.div variants={item}>
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg flex items-center gap-2"><Key className="h-5 w-5 text-primary" />Ví & Bảo mật</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Địa chỉ ví hiện tại</Label>
              <Input value={walletAddress || "Chưa đăng nhập"} disabled />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div variants={item}>
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg flex items-center gap-2"><Bell className="h-5 w-5 text-primary" />Thông báo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["Mint NFT mới", "Thông báo khi có NFT được mint", true],
              ["Xác thực bằng cấp", "Thông báo khi có yêu cầu xác thực", true],
              ["Giao dịch thất bại", "Cảnh báo khi giao dịch lỗi", true],
              ["Báo cáo hàng ngày", "Nhận email tổng hợp mỗi ngày", false],
            ].map(([title, desc, defaultOn]) => (
              <div key={title as string} className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-foreground">{title as string}</p><p className="text-xs text-muted-foreground">{desc as string}</p></div>
                <Switch defaultChecked={defaultOn as boolean} />
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Security */}
      <motion.div variants={item}>
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Bảo mật</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-foreground">Xác thực 2 lớp (2FA)</p><p className="text-xs text-muted-foreground">Bảo vệ tài khoản với xác thực 2 lớp</p></div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-foreground">Tự động khóa</p><p className="text-xs text-muted-foreground">Khóa ví sau 15 phút không hoạt động</p></div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Button onClick={handleSave} className="gap-2"><Save className="h-4 w-4" />Lưu cài đặt</Button>
      </motion.div>
    </motion.div>
  );
}
