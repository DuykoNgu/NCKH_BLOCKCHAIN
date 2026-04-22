import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Search, CheckCircle2, XCircle, AlertTriangle, Hash, GraduationCap, Building, Calendar, Loader2, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { NFTService } from "@/services/nftService";
import type { NFT, VerifyResult } from "@/services/nftService";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const statusDisplay = {
  verified: { label: "Bằng cấp hợp lệ", className: "border-green-400/30 bg-green-400/5", icon: CheckCircle2, color: "text-green-400" },
  revoked: { label: "Bằng cấp đã thu hồi", className: "border-yellow-400/30 bg-yellow-400/5", icon: AlertTriangle, color: "text-yellow-400" },
  invalid: { label: "Không tìm thấy bằng cấp", className: "border-destructive/30 bg-destructive/5", icon: XCircle, color: "text-destructive" },
};

export default function Verify() {
  const [query, setQuery] = useState("");
  const [nft, setNft] = useState<NFT | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [status, setStatus] = useState<"verified" | "revoked" | "invalid" | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!query.trim()) {
      toast.error("Vui lòng nhập Mã chứng chỉ");
      return;
    }

    setLoading(true);
    setNft(null);
    setVerifyResult(null);
    setStatus(null);

    try {
      const response = await NFTService.getNFT(query.trim());
      if ("nft" in response) {
        setNft(response.nft);
        const result = await NFTService.verifyNFT(query.trim());
        setVerifyResult(result);

        if (result.is_revoked) {
          setStatus("revoked");
          toast.warning("Bằng cấp đã bị thu hồi");
        } else if (result.is_valid) {
          setStatus("verified");
          toast.success("Bằng cấp hợp lệ!");
        } else {
          setStatus("invalid");
          toast.error("Chữ ký không hợp lệ");
        }
      } else {
        setStatus("invalid");
        toast.error("Không tìm thấy bằng cấp với mã này");
      }
    } catch {
      setStatus("invalid");
      toast.error("Có lỗi xảy ra khi truy vấn hệ thống");
    } finally {
      setLoading(false);
    }
  };

  const copyToken = () => {
    if (nft) {
      navigator.clipboard.writeText(nft.token_id);
      toast.success("Đã sao chép mã chứng chỉ");
    }
  };

  const formatAddr = (addr: string) =>
    addr ? `${addr.slice(0, 10)}...${addr.slice(-8)}` : "-";

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
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Nhập Token ID (mã chứng chỉ) để kiểm tra tính hợp lệ của bằng cấp
              </p>
            </div>
            <div className="flex gap-3 max-w-xl mx-auto">
              <Input
                placeholder="Nhập Token ID của bằng cấp..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                className="flex-1 font-mono text-sm"
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
        <motion.div variants={item} initial="hidden" animate="show">
          <Card className={`${statusDisplay[status].className} border`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                {(() => {
                  const Icon = statusDisplay[status].icon;
                  return <Icon className={`h-6 w-6 ${statusDisplay[status].color}`} />;
                })()}
                <h3 className={`font-display text-lg font-semibold ${statusDisplay[status].color}`}>
                  {statusDisplay[status].label}
                </h3>
              </div>

              {nft && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Loại bằng cấp</p>
                      <p className="text-sm font-medium text-foreground">{nft.metadata?.degree_type || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <Building className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Đơn vị cấp phát</p>
                      <p className="text-sm font-medium text-foreground">
                        {nft.metadata?.institution_address
                          ? formatAddr(nft.metadata.institution_address)
                          : nft.metadata?.institution || "-"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Ngày cấp</p>
                      <p className="text-sm font-medium text-foreground">
                        {nft.minted_at ? new Date(nft.minted_at * 1000).toLocaleDateString("vi-VN") : "-"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Trạng thái chữ ký</p>
                      <p className={`text-sm font-medium ${verifyResult?.is_valid ? "text-green-400" : "text-destructive"}`}>
                        {verifyResult?.is_valid ? "Chữ ký hợp lệ" : "Chữ ký không hợp lệ"}
                      </p>
                    </div>
                  </div>
                  <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-3 min-w-0">
                      <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Token ID</p>
                        <p className="text-sm font-medium font-mono text-primary truncate">{nft.token_id}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={copyToken} className="shrink-0">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Khoá công khai đơn vị cấp phát</p>
                      <p className="text-sm font-mono text-muted-foreground truncate">
                        {formatAddr(nft.issuer_pubkey)}
                      </p>
                    </div>
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
