import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Search, UserCheck, GraduationCap, Eye, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AccountService } from "@/services/accountService";
import { NFTService } from "@/services/nftService";
import type { AccountInfo } from "@/services/accountService";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

function truncateAddress(addr: string): string {
  if (!addr || addr.length <= 14) return addr || '-';
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

interface StudentDisplay {
  address: string;
  name: string;
  org_name: string;
  role: string;
  is_active: boolean;
  nftCount: number;
}

export default function Students() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentDisplay[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const accountRes = await AccountService.getAllAccounts();
        const accounts = accountRes.accounts || [];

        // For each account, fetch their NFT count
        const studentsWithNfts = await Promise.all(
          accounts.map(async (acc: AccountInfo) => {
            let nftCount = 0;
            try {
              const nftRes = await NFTService.getUserNFTs(acc.address);
              nftCount = nftRes.total || 0;
            } catch {
              // Ignore errors for individual NFT fetches
            }
            return {
              address: acc.address,
              name: acc.full_name || truncateAddress(acc.address),
              org_name: acc.org_name || "-",
              role: acc.role,
              is_active: acc.is_active,
              nftCount,
            };
          })
        );

        setStudents(studentsWithNfts);
      } catch (err) {
        console.error("Failed to fetch accounts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.address.toLowerCase().includes(search.toLowerCase()) ||
    s.org_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalNfts = students.reduce((sum, s) => sum + s.nftCount, 0);
  const activeCount = students.filter((s) => s.is_active).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Đang tải danh sách tài khoản...</span>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Quản lý Tài khoản</h2>
          <p className="text-sm text-muted-foreground mt-1">Danh sách tài khoản đã đăng ký và trạng thái bằng cấp NFT</p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass-card"><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center"><Users className="h-5 w-5 text-primary" /></div>
          <div><p className="text-2xl font-bold font-display text-foreground">{students.length}</p><p className="text-xs text-muted-foreground">Tổng tài khoản</p></div>
        </CardContent></Card>
        <Card className="glass-card"><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-400/20 flex items-center justify-center"><UserCheck className="h-5 w-5 text-green-400" /></div>
          <div><p className="text-2xl font-bold font-display text-foreground">{activeCount}</p><p className="text-xs text-muted-foreground">Đang hoạt động</p></div>
        </CardContent></Card>
        <Card className="glass-card"><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center"><GraduationCap className="h-5 w-5 text-accent" /></div>
          <div><p className="text-2xl font-bold font-display text-foreground">{totalNfts}</p><p className="text-xs text-muted-foreground">NFT đã phát hành</p></div>
        </CardContent></Card>
      </motion.div>

      {/* Search */}
      <motion.div variants={item}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm theo tên, địa chỉ ví..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={item}>
        <Card className="glass-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Địa chỉ ví</TableHead>
                  <TableHead>Tên</TableHead>
                  <TableHead className="hidden md:table-cell">Tổ chức</TableHead>
                  <TableHead className="hidden lg:table-cell">Vai trò</TableHead>
                  <TableHead>NFT</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {students.length === 0 ? "Chưa có tài khoản nào" : "Không tìm thấy kết quả"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((s) => (
                    <TableRow key={s.address}>
                      <TableCell className="font-mono text-primary text-sm">{truncateAddress(s.address)}</TableCell>
                      <TableCell>
                        <p className="font-medium text-foreground">{s.name}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{s.org_name}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline" className={
                          s.role === "moet" ? "bg-purple-400/10 text-purple-400 border-purple-400/20" :
                          s.role === "validator" ? "bg-blue-400/10 text-blue-400 border-blue-400/20" :
                          "bg-gray-400/10 text-gray-400 border-gray-400/20"
                        }>
                          {s.role === "moet" ? "MOET" : s.role === "validator" ? "Validator" : "Client"}
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
    </motion.div>
  );
}
