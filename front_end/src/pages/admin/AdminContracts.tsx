import { motion } from "framer-motion";
import { Blocks, Search, Plus, Filter, CheckCircle2, AlertCircle, Trash2, Edit3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageContainer, AdminPageHeader, AdminStatCard, itemVariants } from "@/components/admin/AdminShared";

export default function AdminContracts() {
  return (
    <AdminPageContainer>
      <AdminPageHeader 
        title="Quản lý Hợp đồng thông minh" 
        description="Quản lý và cấu hình các Smart Contracts cốt lõi của mạng lưới"
      >
        <Button className="gap-2"><Plus className="h-4 w-4" />Triển khai mới</Button>
      </AdminPageHeader>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AdminStatCard label="Hợp đồng đang chạy" value={4} icon={CheckCircle2} iconColor="text-green-400" bgColor="bg-green-400/20" />
        <AdminStatCard label="Cảnh báo bảo mật" value={0} icon={AlertCircle} iconColor="text-green-400" bgColor="bg-green-400/20" />
      </motion.div>

      <motion.div variants={itemVariants} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm hợp đồng..." className="pl-9" />
        </div>
        <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="glass-card border-none shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên Hợp đồng</TableHead><TableHead>Địa chỉ</TableHead>
                  <TableHead>Phiên bản</TableHead><TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { name: "EduDegree NFT", address: "0x742d...444e", version: "v1.2.0", status: "Active" },
                  { name: "Validator Registry", address: "0x912a...1234", version: "v1.0.5", status: "Active" },
                  { name: "Identity Manager", address: "0xab12...ef56", version: "v2.0.1", status: "Active" },
                  { name: "Treasury", address: "0x3344...7788", version: "v1.0.0", status: "Active" },
                ].map((c) => (
                  <TableRow key={c.address}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><Blocks className="h-4 w-4 text-primary" /></div>
                        <span className="font-medium text-foreground">{c.name}</span>
                      </div>
                    </TableCell>
                    <TableCell><span className="font-mono text-xs text-primary">{c.address}</span></TableCell>
                    <TableCell><Badge variant="outline" className="font-mono text-[10px]">{c.version}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className="bg-green-400/10 text-green-400 border-green-400/20">Hoạt động</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"><Edit3 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </AdminPageContainer>
  );
}
