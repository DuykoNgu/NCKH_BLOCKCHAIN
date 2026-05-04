import { useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Search, Plus, Filter, CheckCircle2, Clock, XCircle, Eye, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { adminService } from "@/services/adminService";

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  verified: { label: "Đã xác thực", icon: CheckCircle2, className: "bg-green-400/10 text-green-400 border-green-400/20" },
  pending: { label: "Đang chờ", icon: Clock, className: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" },
  rejected: { label: "Từ chối", icon: XCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
  revoked: { label: "Đã thu hồi", icon: XCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function Degrees() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [mintOpen, setMintOpen] = useState(false);
  const [degrees, setDegrees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDegrees = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllNFTs();
      setDegrees(data.nfts || []);
    } catch (error) {
      console.error("Failed to fetch degrees:", error);
      toast.error("Không thể tải danh sách bằng cấp");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDegrees();
  }, []);

  const filtered = degrees.filter((d) => {
    const name = d.recipient_name || "";
    const degreeType = d.metadata?.degree_type || "";
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) || 
                      degreeType.toLowerCase().includes(search.toLowerCase());
    
    const status = d.is_valid ? "verified" : "revoked";
    const matchStatus = filterStatus === "all" || status === filterStatus;
    
    return matchSearch && matchStatus;
  });

  const handleMint = () => {
    toast.success("Hệ thống hiện tại yêu cầu Trường đại học tự Mint. Admin chỉ có quyền quản lý và thu hồi.");
    setMintOpen(false);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Bằng cấp NFT</h2>
          <p className="text-sm text-muted-foreground mt-1">Quản lý tất cả bằng cấp đã phát hành dưới dạng NFT trong mạng lưới</p>
        </div>
        <Dialog open={mintOpen} onOpenChange={setMintOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Cấp bằng mới
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-border">
            <DialogHeader>
              <DialogTitle className="font-display">Cấp bằng NFT mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-sm">
                Lưu ý: Theo quy trình nghiệp vụ, bằng cấp sẽ được trực tiếp các Trường đại học (Validator) khởi tạo và ký duyệt.
              </div>
              <div className="space-y-2">
                <Label>Họ và tên sinh viên</Label>
                <Input placeholder="Nhập họ tên..." />
              </div>
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
              <Button onClick={handleMint} className="w-full">Khởi tạo yêu cầu</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-foreground">{degrees.length}</p>
              <p className="text-xs text-muted-foreground">Tổng NFT</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-400/20 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-foreground">{degrees.filter(d => d.is_valid).length}</p>
              <p className="text-xs text-muted-foreground">Đã xác thực</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/20 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-foreground">{degrees.filter(d => !d.is_valid).length}</p>
              <p className="text-xs text-muted-foreground">Đã thu hồi</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm theo tên, loại bằng..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="verified">Đã xác thực</SelectItem>
            <SelectItem value="revoked">Đã thu hồi</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Table */}
      <motion.div variants={item}>
        <Card className="glass-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token ID</TableHead>
                  <TableHead>Sinh viên</TableHead>
                  <TableHead className="hidden md:table-cell">Bằng cấp</TableHead>
                  <TableHead className="hidden lg:table-cell">Cơ sở cấp</TableHead>
                  <TableHead className="hidden sm:table-cell">Ngày cấp</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span>Đang tải dữ liệu...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.map((deg) => {
                  const status = deg.is_valid ? "verified" : "revoked";
                  const sc = statusConfig[status];
                  const dateStr = deg.minted_at ? new Date(deg.minted_at * 1000).toLocaleDateString("vi-VN") : "N/A";
                  
                  return (
                    <TableRow key={deg.token_id}>
                      <TableCell className="font-mono text-primary text-xs">{deg.token_id.slice(0, 8)}...</TableCell>
                      <TableCell className="font-medium text-foreground">{deg.recipient_name || deg.owner_address || "N/A"}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{deg.metadata?.degree_type}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">{deg.metadata?.institution_address}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{dateStr}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={sc.className}>
                          <sc.icon className="h-3 w-3 mr-1" />
                          {sc.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

