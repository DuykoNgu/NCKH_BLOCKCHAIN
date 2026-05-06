import { motion } from "framer-motion";
import { Settings, Shield, Bell, Database, Globe, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AdminPageContainer, AdminPageHeader, itemVariants } from "@/components/admin/AdminShared";

export default function AdminSettings() {
  const sections = [
    {
      title: "Cấu hình Mạng lưới",
      description: "Quản lý các thông số cốt lõi của EduChain",
      icon: Globe,
      fields: [
        { label: "Network Name", value: "EduChain Mainnet" },
        { label: "Chain ID", value: "12345" },
        { label: "RPC URL", value: "https://rpc.educhain.io" },
      ]
    },
    {
      title: "Bảo mật & Quyền",
      description: "Thiết lập quyền hạn và chính sách bảo mật",
      icon: Shield,
      switches: [
        { label: "Yêu cầu KYC cho Validator", enabled: true },
        { label: "Tự động khóa Node nghi vấn", enabled: true },
        { label: "Xác thực 2 lớp (2FA) cho Admin", enabled: false },
      ]
    },
    {
      title: "Thông báo",
      description: "Cấu hình kênh nhận thông báo hệ thống",
      icon: Bell,
      switches: [
        { label: "Thông báo Mint NFT mới", enabled: true },
        { label: "Cảnh báo Node Offline", enabled: true },
        { label: "Báo cáo tuần qua Email", enabled: false },
      ]
    }
  ];

  return (
    <AdminPageContainer>
      <AdminPageHeader 
        title="Cài đặt Hệ thống" 
        description="Cấu hình tham số mạng lưới và tùy chỉnh trải nghiệm quản trị"
      >
        <Button className="gap-2"><Save className="h-4 w-4" />Lưu thay đổi</Button>
      </AdminPageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map((section) => (
          <motion.div key={section.title} variants={itemVariants}>
            <Card className="glass-card border-none shadow-sm h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <section.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">{section.title}</CardTitle>
                    <CardDescription className="text-xs">{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.fields?.map((f) => (
                  <div key={f.label} className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{f.label}</Label>
                    <Input defaultValue={f.value} className="bg-secondary/30 border-none h-10" />
                  </div>
                ))}
                {section.switches?.map((s) => (
                  <div key={s.label} className="flex items-center justify-between py-2 border-t border-border/50 first:border-none">
                    <Label className="text-sm font-medium">{s.label}</Label>
                    <Switch defaultChecked={s.enabled} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        ))}

        <motion.div variants={itemVariants}>
          <Card className="glass-card border-none shadow-sm bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Dữ liệu & Sao lưu</CardTitle>
                  <CardDescription className="text-xs">Quản lý cơ sở dữ liệu và các bản snapshot</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                <p className="text-xs text-muted-foreground mb-2">Bản sao lưu gần nhất: 2 giờ trước</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">Tải bản sao lưu</Button>
                  <Button variant="outline" size="sm" className="flex-1">Tạo mới</Button>
                </div>
              </div>
              <Button variant="ghost" className="w-full text-xs text-destructive hover:bg-destructive/10">Xóa Cache Hệ thống</Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AdminPageContainer>
  );
}
