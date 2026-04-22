import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Activity, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminService } from "@/services/adminService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function Transactions() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllTransactions();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filtered = transactions.filter((tx) => {
    const op = tx.payload?.op || "";
    const hash = tx.tx_hash || "";
    const matchSearch = hash.toLowerCase().includes(search.toLowerCase()) || 
                      op.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || op.toLowerCase() === filterType.toLowerCase();
    return matchSearch && matchType;
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h2 className="font-display text-2xl font-bold text-foreground">Lịch sử Giao dịch</h2>
        <p className="text-sm text-muted-foreground mt-1">Theo dõi toàn bộ các hoạt động trên mạng lưới Blockchain EduChain</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-foreground">{transactions.length}</p>
              <p className="text-xs text-muted-foreground">Tổng giao dịch</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Tìm kiếm theo mã hash, loại giao dịch..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-9" 
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Loại giao dịch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="mint_nft">Mint NFT</SelectItem>
            <SelectItem value="register">Đăng ký</SelectItem>
            <SelectItem value="approve_validator">Phê duyệt</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      <motion.div variants={item}>
        <Card className="glass-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã Hash</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead className="hidden md:table-cell">Từ</TableHead>
                  <TableHead className="hidden lg:table-cell">Đến</TableHead>
                  <TableHead className="hidden sm:table-cell">Thời gian</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Chi tiết</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span>Đang tải lịch sử...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.map((tx) => {
                  const dateStr = tx.timestamp ? new Date(tx.timestamp * 1000).toLocaleString("vi-VN") : "N/A";
                  const op = tx.payload?.op || "Unknown";
                  const txHash = tx.tx_hash || tx.hash || "";
                  return (
                    <TableRow key={txHash}>
                      <TableCell className="font-mono text-primary text-xs cursor-help" title={txHash}>
                        {txHash.slice(0, 10)}...
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-none text-xs">
                          {op === "mint_nft" ? "Cấp bằng" : op === "revoke_nft" ? "Thu hồi" : op === "register_user" ? "Đăng ký" : op === "approve_validator" ? "Phê duyệt" : op}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">
                        {tx.sender_address ? `${tx.sender_address.slice(0, 8)}...` : "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground">
                        {tx.recipient_address ? `${tx.recipient_address.slice(0, 8)}...` : "Hệ thống"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                        {dateStr}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-400/10 text-green-400 border-green-400/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Thành công
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!loading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      Không tìm thấy giao dịch nào
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
