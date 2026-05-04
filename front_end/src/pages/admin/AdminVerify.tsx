import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Search, CheckCircle2, XCircle, AlertTriangle, Hash, User, GraduationCap, Building, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

type VerifyResult = {
  status: "verified" | "invalid" | "pending";
  name: string;
  degree: string;
  university: string;
  date: string;
  tokenId: string;
  txHash: string;
} | null;

const mockResults: Record<string, VerifyResult> = {
  "0x7a3b...f821": { status: "verified", name: "Nguyễn Văn An", degree: "Cử nhân CNTT", university: "ĐH Bách Khoa HN", date: "2024-03-10", tokenId: "#1247", txHash: "0x7a3bf821...abc123" },
  "1247": { status: "verified", name: "Nguyễn Văn An", degree: "Cử nhân CNTT", university: "ĐH Bách Khoa HN", date: "2024-03-10", tokenId: "#1247", txHash: "0x7a3bf821...abc123" },
  "0x4e1f...d547": { status: "pending", name: "Lê Hoàng Cường", degree: "Cử nhân Luật", university: "ĐH Luật Hà Nội", date: "2024-03-09", tokenId: "#1245", txHash: "0x4e1fd547...def456" },
};

const recentVerifications = [
  { hash: "0x7a3b...f821", name: "Nguyễn Văn An", status: "verified", time: "5 phút trước" },
  { hash: "0x9c2d...a193", name: "Trần Thị Bình", status: "verified", time: "12 phút trước" },
  { hash: "0x4e1f...d547", name: "Lê Hoàng Cường", status: "pending", time: "30 phút trước" },
  { hash: "0xffff...0000", name: "Unknown", status: "invalid", time: "1 giờ trước" },
];

const statusDisplay = {
  verified: { label: "✅ Bằng cấp hợp lệ", className: "border-green-400/30 bg-green-400/5", icon: CheckCircle2, color: "text-green-400" },
  pending: { label: "⏳ Đang chờ xác thực", className: "border-yellow-400/30 bg-yellow-400/5", icon: AlertTriangle, color: "text-yellow-400" },
  invalid: { label: "❌ Không tìm thấy", className: "border-destructive/30 bg-destructive/5", icon: XCircle, color: "text-destructive" },
};

export default function Verify() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<VerifyResult | "invalid" | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = () => {
    if (!query.trim()) { toast.error("Vui lòng nhập mã hash hoặc Token ID"); return; }
    setLoading(true);
    setTimeout(() => {
      const found = mockResults[query.trim()];
      setResult(found || "invalid");
      setLoading(false);
      if (found?.status === "verified") toast.success("Bằng cấp hợp lệ!");
      else if (!found) toast.error("Không tìm thấy bằng cấp!");
    }, 1200);
  };

  const resolvedResult = result === "invalid" ? null : result;
  const resolvedStatus = result === "invalid" ? "invalid" : result?.status;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h2 className="font-display text-2xl font-bold text-foreground">Xác thực bằng cấp</h2>
        <p className="text-sm text-muted-foreground mt-1">Tra cứu và xác thực bằng cấp NFT trên blockchain</p>
      </motion.div>

      {/* Search */}
      <motion.div variants={item}>
        <Card className="gradient-border overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">Xác thực trên Blockchain</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">Nhập Transaction Hash hoặc Token ID để kiểm tra tính hợp lệ của bằng cấp</p>
            </div>
            <div className="flex gap-3 max-w-xl mx-auto">
              <Input placeholder="Nhập TX Hash hoặc Token ID (vd: 0x7a3b...f821 hoặc 1247)" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleVerify()} className="flex-1" />
              <Button onClick={handleVerify} disabled={loading} className="gap-2 min-w-[120px]">
                {loading ? <span className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" /> : <Search className="h-4 w-4" />}
                Xác thực
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Result */}
      {resolvedStatus && (
        <motion.div variants={item}>
          <Card className={`${statusDisplay[resolvedStatus].className} border`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                {(() => { const Icon = statusDisplay[resolvedStatus].icon; return <Icon className={`h-6 w-6 ${statusDisplay[resolvedStatus].color}`} />; })()}
                <h3 className={`font-display text-lg font-semibold ${statusDisplay[resolvedStatus].color}`}>{statusDisplay[resolvedStatus].label}</h3>
              </div>
              {resolvedResult && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div><p className="text-xs text-muted-foreground">Sinh viên</p><p className="text-sm font-medium text-foreground">{resolvedResult.name}</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <div><p className="text-xs text-muted-foreground">Bằng cấp</p><p className="text-sm font-medium text-foreground">{resolvedResult.degree}</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div><p className="text-xs text-muted-foreground">Trường</p><p className="text-sm font-medium text-foreground">{resolvedResult.university}</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div><p className="text-xs text-muted-foreground">Ngày cấp</p><p className="text-sm font-medium text-foreground">{resolvedResult.date}</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <div><p className="text-xs text-muted-foreground">Token ID</p><p className="text-sm font-medium font-mono text-primary">{resolvedResult.tokenId}</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div><p className="text-xs text-muted-foreground">TX Hash</p><p className="text-sm font-medium font-mono text-primary">{resolvedResult.txHash}</p></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent */}
      <motion.div variants={item}>
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg">Lịch sử xác thực gần đây</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentVerifications.map((v, i) => {
                const sd = statusDisplay[v.status as keyof typeof statusDisplay];
                const Icon = sd.icon;
                return (
                  <div key={i} className="flex items-center justify-between px-6 py-3 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${sd.color}`} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{v.name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{v.hash}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{v.time}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
