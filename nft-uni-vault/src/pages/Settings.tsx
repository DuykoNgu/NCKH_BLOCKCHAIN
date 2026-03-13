import { motion } from "framer-motion";
import { Settings as SettingsIcon, Shield, Bell, Globe, Key, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function Settings() {
  const handleSave = () => toast.success("Đã lưu cài đặt!");

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
              <Select defaultValue="mainnet">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mainnet">Ethereum Mainnet</SelectItem>
                  <SelectItem value="goerli">Goerli Testnet</SelectItem>
                  <SelectItem value="sepolia">Sepolia Testnet</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>RPC URL</Label>
              <Input defaultValue="https://mainnet.infura.io/v3/..." />
            </div>
            <div className="space-y-2">
              <Label>Chain ID</Label>
              <Input defaultValue="1" disabled />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Contract */}
      <motion.div variants={item}>
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg flex items-center gap-2"><Key className="h-5 w-5 text-primary" />Smart Contract</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Contract Address</Label>
              <Input defaultValue="0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b" />
            </div>
            <div className="space-y-2">
              <Label>IPFS Gateway</Label>
              <Input defaultValue="https://ipfs.io/ipfs/" />
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
