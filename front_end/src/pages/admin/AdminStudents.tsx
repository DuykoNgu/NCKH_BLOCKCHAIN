import { motion } from "framer-motion";
import { Users, Search, UserCheck, GraduationCap, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminStudents } from "@/hooks";
import { truncateAddress } from "@/utils/formatUtils";
import { AdminPageContainer, AdminPageHeader, AdminStatCard, itemVariants } from "@/components/admin/AdminShared";
import { getRoleInfo } from "@/utils/uiUtils";

export default function Students() {
  const {
    search, setSearch, loading, students, filtered, totalNfts, activeCount, isValidator
  } = useAdminStudents();

  // Basic layout should show immediately, only the table or stats might be skeletonized
  const isInitialLoading = loading && students.length === 0;

  return (
    <AdminPageContainer>
      <AdminPageHeader 
        title={isValidator ? "Quản lý Sinh viên" : "Quản lý Tài khoản"} 
        description={isValidator 
          ? "Danh sách sinh viên và trạng thái bằng cấp đã cấp phát" 
          : "Danh sách tất cả tài khoản đã đăng ký trên hệ thống"
        }
      />

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard 
          label={isValidator ? "Tổng sinh viên" : "Tổng tài khoản"} 
          value={isInitialLoading ? "..." : students.length} 
          icon={Users} 
        />
        <AdminStatCard label="Đang hoạt động" value={isInitialLoading ? "..." : activeCount} icon={UserCheck} iconColor="text-green-400" bgColor="bg-green-400/20" />
        <AdminStatCard label="NFT đã phát hành" value={isInitialLoading ? "..." : totalNfts} icon={GraduationCap} iconColor="text-accent" bgColor="bg-accent/20" />
      </motion.div>

      <motion.div variants={itemVariants} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm theo tên, địa chỉ ví..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="glass-card border-none shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Địa chỉ ví</TableHead><TableHead>Tên</TableHead>
                  <TableHead className="hidden md:table-cell">Tổ chức</TableHead><TableHead className="hidden lg:table-cell">Vai trò</TableHead>
                  <TableHead>NFT</TableHead><TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isInitialLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-4 w-24 bg-secondary animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-4 w-32 bg-secondary animate-pulse rounded" /></TableCell>
                      <TableCell className="hidden md:table-cell"><div className="h-4 w-40 bg-secondary animate-pulse rounded" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><div className="h-6 w-16 bg-secondary animate-pulse rounded-full" /></TableCell>
                      <TableCell><div className="h-6 w-10 bg-secondary animate-pulse rounded-full" /></TableCell>
                      <TableCell><div className="h-6 w-20 bg-secondary animate-pulse rounded-full" /></TableCell>
                      <TableCell className="text-right"><div className="h-8 w-8 bg-secondary animate-pulse rounded-full ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Không tìm thấy kết quả</TableCell></TableRow>
                ) : (
                  filtered.map((s: any) => (
                    <TableRow key={s.address}>
                      <TableCell className="font-mono text-primary text-sm">{truncateAddress(s.address)}</TableCell>
                      <TableCell><p className="font-medium text-foreground">{s.name}</p></TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{s.org_name}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline" className={getRoleInfo(s.role).className}>
                          {getRoleInfo(s.role).label}
                        </Badge>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{s.nftCount}</Badge></TableCell>
                      <TableCell>
                        <Badge variant="outline" className={s.is_active ? "bg-green-400/10 text-green-400 border-green-400/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
                          {s.is_active ? "Hoạt động" : "Bị khóa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"><Eye className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </AdminPageContainer>
  );
}
