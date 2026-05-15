import { GraduationCap, Search, Filter, CheckCircle2, Clock, XCircle, Eye, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { DegreeDetailModal } from "@/components/admin/DegreeDetailModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAdminDegrees } from "@/hooks";
import { useAuth } from "@/hooks/useAuth";
import { AdminPageContainer, AdminPageHeader, AdminStatCard, itemVariants } from "@/components/admin/AdminShared";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NFTCreate } from "@/components/common/nft/NFTCreate";


const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
  verified: { label: "Đã xác thực", icon: CheckCircle2, className: "bg-green-400/10 text-green-400 border-green-400/20" },
  pending: { label: "Đang chờ", icon: Clock, className: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" },
  rejected: { label: "Đã thu hồi", icon: XCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
  revoked: { label: "Đã thu hồi", icon: XCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function Degrees() {
  const { address } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "list";

  const {
    search, setSearch, filterStatus, setFilterStatus,
    loading, nfts, degrees, filtered
  } = useAdminDegrees();

  const [selectedDegree, setSelectedDegree] = useState<any>(null);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const handleDownload = (pdfUrl: string, filename: string) => {
    if (!pdfUrl) {
      toast.error("Không tìm thấy file PDF để tải về");
      return;
    }
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = filename || "certificate.pdf";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đang bắt đầu tải về...");
  };

  const isInitialLoading = loading && nfts.length === 0;

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Bằng cấp NFT"
        description="Quản lý tất cả bằng cấp đã phát hành dưới dạng NFT trong mạng lưới"
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="list">Danh sách bằng cấp</TabsTrigger>
          <TabsTrigger value="create">Cấp phát bằng mới</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <NFTCreate account={address || ""} />
          </motion.div>
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <AdminStatCard label="Tổng NFT" value={nfts.length} icon={GraduationCap} />
            <AdminStatCard label="Đã xác thực" value={degrees.filter(d => d.is_valid !== false).length} icon={CheckCircle2} iconColor="text-green-400" bgColor="bg-green-400/20" />
            <AdminStatCard label="Đã thu hồi" value={degrees.filter(d => d.is_valid === false).length} icon={XCircle} iconColor="text-destructive" bgColor="bg-destructive/20" />
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm kiếm theo tên sinh viên hoặc loại bằng..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px]"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="verified">Đã xác thực</SelectItem>
                <SelectItem value="pending">Đang chờ</SelectItem>
                <SelectItem value="rejected">Đã thu hồi</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="glass-card border-none shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[150px]">Token ID</TableHead>
                      <TableHead>Loại bằng</TableHead>
                      <TableHead className="hidden md:table-cell">Sinh viên</TableHead>
                      <TableHead className="hidden sm:table-cell">Ngày cấp</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isInitialLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><div className="h-4 w-32 bg-secondary animate-pulse rounded" /></TableCell>
                          <TableCell><div className="h-4 w-40 bg-secondary animate-pulse rounded" /></TableCell>
                          <TableCell className="hidden md:table-cell"><div className="h-4 w-32 bg-secondary animate-pulse rounded" /></TableCell>
                          <TableCell className="hidden sm:table-cell"><div className="h-4 w-20 bg-secondary animate-pulse rounded" /></TableCell>
                          <TableCell><div className="h-6 w-24 bg-secondary animate-pulse rounded-full" /></TableCell>
                          <TableCell className="text-right"><div className="h-8 w-16 bg-secondary animate-pulse rounded ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-20">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <GraduationCap className="h-10 w-10 opacity-20" />
                          <p>Không tìm thấy kết quả phù hợp</p>
                        </div>
                      </TableCell></TableRow>
                    ) : (
                      filtered.map((deg: any) => {
                        const status = deg.is_valid === false ? "revoked" : (deg.status || "verified");
                        const sc = statusConfig[status] || statusConfig.pending;
                        return (
                          <TableRow key={deg.id || deg.tokenId} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="font-mono text-primary text-xs">{(deg.id || deg.tokenId || "").slice(0, 14)}...</TableCell>
                            <TableCell className="font-medium text-foreground">{deg.degree || deg.metadata?.degree_type}</TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground">{deg.recipient_name || deg.metadata?.student_id || "N/A"}</TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">{deg.date}</TableCell>
                            <TableCell><Badge variant="outline" className={`${sc.className} border-none`}>{sc.label}</Badge></TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                                  onClick={() => setSelectedDegree(deg)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                                  onClick={() => handleDownload(deg.pdf_url || deg.metadata?.pdf_url, `certificate_${deg.id || deg.tokenId}.pdf`)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody >
                </Table >
              </CardContent >
            </Card >
          </motion.div >
        </TabsContent>
      </Tabs>

       <DegreeDetailModal 
         degree={selectedDegree} 
         isOpen={!!selectedDegree} 
         onClose={() => setSelectedDegree(null)} 
         onDownload={handleDownload}
       />
     </AdminPageContainer >
  );
}
