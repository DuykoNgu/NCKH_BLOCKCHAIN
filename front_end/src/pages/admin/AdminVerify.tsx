import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Search, CheckCircle2, XCircle, AlertTriangle, Hash, GraduationCap, Building, Calendar, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { NFTService } from "@/services/nftService";
import type { NFT, VerifyResult } from "@/services/nftService";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

type VerifyStatus = "verified" | "invalid" | "pending" | "revoked";

const statusDisplay: Record<VerifyStatus, { label: string; className: string; icon: typeof CheckCircle2; color: string }> = {
  verified: { label: "✅ Bằng cấp hợp lệ", className: "border-green-400/30 bg-green-400/5", icon: CheckCircle2, color: "text-green-400" },
  pending: { label: "⏳ Đang chờ xác thực", className: "border-yellow-400/30 bg-yellow-400/5", icon: AlertTriangle, color: "text-yellow-400" },
  invalid: { label: "❌ Không tìm thấy", className: "border-destructive/30 bg-destructive/5", icon: XCircle, color: "text-destructive" },
  revoked: { label: "🚫 Đã bị thu hồi", className: "border-destructive/30 bg-destructive/5", icon: XCircle, color: "text-destructive" },
};

function truncateHash(hash: string, start = 10, end = 8): string {
  if (!hash || hash.length <= start + end) return hash || '-';
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}

export default function Verify() {
  const [query, setQuery] = useState("");
  const [nft, setNft] = useState<NFT | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [status, setStatus] = useState<VerifyStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!query.trim()) { toast.error("Vui lòng nhập Token ID"); return; }
    setLoading(true);
    setNft(null);
    setVerifyResult(null);
    setStatus(null);

    try {
      // 1. Fetch NFT info
      const nftRes = await NFTService.getNFT(query.trim());
      if ('error' in nftRes) {
        setStatus("invalid");
        toast.error("Không tìm thấy bằng cấp!");
        setLoading(false);
        return;
      }

      setNft(nftRes.nft);

      // 2. Verify signature
      const result = await NFTService.verifyNFT(query.trim());
      setVerifyResult(result);

      if (result.is_revoked) {
        setStatus("revoked");
        toast.warning("Bằng cấp đã bị thu hồi");
      } else if (result.is_valid) {
        setStatus("verified");
        toast.success("Bằng cấp hợp lệ!");
      } else {
        setStatus("pending");
        toast.warning("Chữ ký không hợp lệ");
      }
    } catch (err) {
      setStatus("invalid");
      toast.error("Có lỗi xảy ra khi truy vấn");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
              <p className="text-sm text-muted-foreground mt-1 max-w-md">Nhập Token ID để kiểm tra tính hợp lệ của bằng cấp NFT</p>
            </div>
            <div className="flex gap-3 max-w-xl mx-auto">
              <Input
                placeholder="Nhập Token ID..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                className="flex-1"
              />
              <Button onClick={handleVerify} disabled={loading} className="gap-2 min-w-[120px]">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Xác thực
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Result */}
      {status && (
        <motion.div variants={item}>
          <Card className={`${statusDisplay[status].className} border`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                {(() => { const Icon = statusDisplay[status].icon; return <Icon className={`h-6 w-6 ${statusDisplay[status].color}`} />; })()}
                <h3 className={`font-display text-lg font-semibold ${statusDisplay[status].color}`}>{statusDisplay[status].label}</h3>
              </div>
              {nft && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <div><p className="text-xs text-muted-foreground">Loại bằng</p><p className="text-sm font-medium text-foreground">{nft.metadata?.degree_type || "-"}</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div><p className="text-xs text-muted-foreground">Tổ chức phát hành</p><p className="text-sm font-medium text-foreground font-mono">{truncateHash(nft.metadata?.institution_address || nft.issuer_address || "-")}</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div><p className="text-xs text-muted-foreground">Ngày cấp</p><p className="text-sm font-medium text-foreground">{nft.minted_at ? new Date(nft.minted_at).toLocaleDateString("vi-VN") : "-"}</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <div><p className="text-xs text-muted-foreground">Token ID</p><p className="text-sm font-medium font-mono text-primary">{truncateHash(nft.token_id)}</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div><p className="text-xs text-muted-foreground">Chữ ký số</p><p className="text-sm font-medium font-mono text-primary">{verifyResult?.is_valid ? "✅ Hợp lệ" : "❌ Không hợp lệ"}</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div><p className="text-xs text-muted-foreground">Trạng thái</p><p className="text-sm font-medium text-foreground">{verifyResult?.is_revoked ? "Đã thu hồi" : "Đang hiệu lực"}</p></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
