import { GraduationCap, Search, Plus, Filter, CheckCircle2, Clock, XCircle, Eye, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminDegrees } from "@/hooks/useAdminDegrees";
import { TablePageSkeleton } from "@/components/admin/AdminSkeletons";
import { AdminPageContainer, AdminPageHeader, AdminStatCard, itemVariants } from "@/components/admin/AdminShared";
import { motion } from "framer-motion";

const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
  verified: { label: "Đã xác thực", icon: CheckCircle2, className: "bg-green-400/10 text-green-400 border-green-400/20" },
  pending: { label: "Đang chờ", icon: Clock, className: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" },
  rejected: { label: "Đã thu hồi", icon: XCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function Degrees() {
  const {
    search, setSearch, filterStatus, setFilterStatus, mintOpen, setMintOpen,
    loading, nfts, degrees, filtered, handleMint
  } = useAdminDegrees();

  if (loading) return <TablePageSkeleton />;

  return (
    <AdminPageContainer>
      <AdminPageHeader 
        title="Bằng cấp NFT" 
        description="Quản lý tất cả bằng cấp đã phát hành dưới dạng NFT trong mạng lưới"
      >
        <Dialog open={mintOpen} onOpenChange={setMintOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />Cấp bằng mới</Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-border">
            <DialogHeader><DialogTitle className="font-display">Cấp bằng NFT mới</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Loại bằng cấp</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Chọn loại bằng" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bachelor">Cử nhân</SelectItem>
                    <SelectItem value="engineer">Kỹ sư</SelectItem>
                    <SelectItem value="master">Thạc sĩ</SelectItem>
                    <SelectItem value="doctor">Tiến sĩ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>PDF URL</Label><Input placeholder="https://example.com/cert.pdf" /></div>
              <div className="space-y-2"><Label>Địa chỉ ví sinh viên (recipient)</Label><Input placeholder="0x..." /></div>
              <Button onClick={handleMint} className="w-full">Mint NFT</Button>
            </div>
          </DialogContent>
        </Dialog>
      </AdminPageHeader>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard label="Tổng NFT" value={nfts.length} icon={GraduationCap} />
        <AdminStatCard label="Đã xác thực" value={degrees.filter(d => d.is_valid).length} icon={CheckCircle2} iconColor="text-green-400" bgColor="bg-green-400/20" />
        <AdminStatCard label="Đã thu hồi" value={degrees.filter(d => !d.is_valid).length} icon={XCircle} iconColor="text-destructive" bgColor="bg-destructive/20" />
      </motion.div>

      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm theo loại bằng cấp..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
        <Card className="glass-card border-none shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token ID</TableHead><TableHead>Loại bằng</TableHead>
                  <TableHead className="hidden md:table-cell">Tổ chức</TableHead><TableHead className="hidden sm:table-cell">Ngày</TableHead>
                  <TableHead>Trạng thái</TableHead><TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Không tìm thấy kết quả</TableCell></TableRow>
                ) : (
                  filtered.map((deg) => {
                    const sc = statusConfig[deg.status] || statusConfig.pending;
                    return (
                      <TableRow key={deg.id}>
                        <TableCell className="font-mono text-primary text-sm">{deg.tokenId}</TableCell>
                        <TableCell className="font-medium text-foreground">{deg.degree}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{deg.university}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">{deg.date}</TableCell>
                        <TableCell><Badge variant="outline" className={sc.className}><sc.icon className="h-3 w-3 mr-1" />{sc.label}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"><Download className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </AdminPageContainer>
  );
}
