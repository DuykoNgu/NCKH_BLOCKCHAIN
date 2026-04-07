import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, CheckCircle2, Info, Mail, Phone, User, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { adminService } from "@/services/adminService";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function AdminValidators() {
  const [validators, setValidators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchValidators = async () => {
    try {
      setLoading(true);
      const data = await adminService.getPendingValidators();
      setValidators(data.users || []);
    } catch (error) {
      console.error("Failed to fetch validators:", error);
      toast.error("Không thể tải danh sách trường chờ duyệt");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValidators();
  }, []);

  const handleApprove = async (address: string) => {
    try {
      const res = await adminService.approveValidator(address);
      if (res.success) {
        toast.success("Đã phê duyệt trường thành công!");
        fetchValidators();
      }
    } catch (error) {
      toast.error("Phê duyệt thất bại");
    }
  };

  const filtered = validators.filter((v) => 
    v.org_name?.toLowerCase().includes(search.toLowerCase()) || 
    v.address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h2 className="font-display text-2xl font-bold text-foreground">Phê duyệt Trường (Validator)</h2>
        <p className="text-sm text-muted-foreground mt-1">Xác minh danh tính pháp lý và cấp quyền tham gia mạng lưới cho các cơ sở giáo dục</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-400/20 flex items-center justify-center">
              <Info className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-foreground">{validators.length}</p>
              <p className="text-xs text-muted-foreground">Yêu cầu mới</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Tìm kiếm theo tên trường, địa chỉ ví..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="pl-9" 
        />
      </motion.div>

      <motion.div variants={item}>
        <Card className="glass-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên cơ sở giáo dục</TableHead>
                  <TableHead>Thông tin liên hệ</TableHead>
                  <TableHead>Đại diện pháp luật</TableHead>
                  <TableHead>Địa chỉ ví</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length > 0 ? filtered.map((v) => (
                  <TableRow key={v.address}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{v.org_name || "N/A"}</p>
                          <p className="text-xs text-muted-foreground mt-1">MST: {v.tax_id || "Chưa cập nhật"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" /> {v.email || "N/A"}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" /> {v.phone || "N/A"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{v.representative || "N/A"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-primary">{v.address.slice(0, 10)}...{v.address.slice(-6)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                          Từ chối
                        </Button>
                        <Button 
                          onClick={() => handleApprove(v.address)}
                          size="sm" 
                          className="bg-green-500 hover:bg-green-600 text-white gap-2"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Phê duyệt
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      {loading ? "Đang tải danh sách..." : "Không có yêu cầu phê duyệt nào"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
