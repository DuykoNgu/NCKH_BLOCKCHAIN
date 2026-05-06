import { motion } from "framer-motion";
import { Search, Shield, GraduationCap, Building, Calendar, Hash, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVerify } from "@/hooks";
import { truncateHash } from "@/utils/formatUtils";
import { AdminPageContainer, AdminPageHeader, itemVariants } from "@/components/admin/AdminShared";
import { VERIFY_STATUS_DISPLAY } from "@/constants/ui";


export default function Verify() {
  const { query, setQuery, status, loading, nft, verifyResult, handleVerify } = useVerify();

  return (
    <AdminPageContainer>
      <AdminPageHeader title="Xác thực bằng cấp" description="Tra cứu và xác thực bằng cấp NFT trên blockchain" />

      <motion.div variants={itemVariants}>
        <Card className="gradient-border overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-4"><Shield className="h-8 w-8 text-primary" /></div>
              <h3 className="font-display text-lg font-semibold text-foreground">Xác thực trên Blockchain</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">Nhập Token ID để kiểm tra tính hợp lệ của bằng cấp NFT</p>
            </div>
            <div className="flex gap-3 max-w-xl mx-auto">
              <Input placeholder="Nhập Token ID..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleVerify()} className="flex-1" />
              <Button onClick={handleVerify} disabled={loading} className="gap-2 min-w-[120px]">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Xác thực
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {status && (
        <motion.div variants={itemVariants}>
          <Card className={`${VERIFY_STATUS_DISPLAY[status as keyof typeof VERIFY_STATUS_DISPLAY].className} border`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                {(() => { 
                  const Icon = VERIFY_STATUS_DISPLAY[status as keyof typeof VERIFY_STATUS_DISPLAY].icon; 
                  return <Icon className={`h-6 w-6 ${VERIFY_STATUS_DISPLAY[status as keyof typeof VERIFY_STATUS_DISPLAY].color}`} />; 
                })()}
                <h3 className={`font-display text-lg font-semibold ${VERIFY_STATUS_DISPLAY[status as keyof typeof VERIFY_STATUS_DISPLAY].color}`}>
                  {VERIFY_STATUS_DISPLAY[status as keyof typeof VERIFY_STATUS_DISPLAY].label}
                </h3>
              </div>
              {nft && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  {[
                    { label: "Loại bằng", value: nft.metadata?.degree_type, icon: GraduationCap },
                    { label: "Tổ chức", value: truncateHash(nft.metadata?.institution_address || nft.issuer_address || ""), icon: Building, mono: true },
                    { label: "Ngày cấp", value: nft.minted_at ? new Date(nft.minted_at).toLocaleDateString("vi-VN") : "-", icon: Calendar },
                    { label: "Token ID", value: truncateHash(nft.token_id), icon: Hash, mono: true, primary: true },
                    { label: "Chữ ký số", value: verifyResult?.is_valid ? "✅ Hợp lệ" : "❌ Lỗi", icon: Shield, primary: true },
                    { label: "Trạng thái", value: verifyResult?.is_revoked ? "Đã thu hồi" : "Hiệu lực", icon: Shield },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">{item.label}</p>
                        <p className={`text-sm font-medium ${item.mono ? "font-mono" : ""} ${item.primary ? "text-primary" : "text-foreground"}`}>{item.value || "-"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AdminPageContainer>
  );
}
