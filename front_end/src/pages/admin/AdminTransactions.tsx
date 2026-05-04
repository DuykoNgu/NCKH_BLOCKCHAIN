import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Search, Filter, ExternalLink, ArrowUpRight, ArrowDownLeft, RefreshCw, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransactionService } from "@/services/transactionService";
import type { TransactionInfo } from "@/services/transactionService";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const typeIcons: Record<string, typeof ArrowUpRight> = {
  "mint_nft": ArrowUpRight,
  "verify": RefreshCw,
  "transfer": ArrowDownLeft,
  "revoke": ArrowDownLeft,
};

function truncateHash(hash: string, start = 8, end = 6): string {
  if (!hash || hash.length <= start + end) return hash || '-';
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  if (diff < 60) return `${Math.floor(diff)} giây trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

function getOpLabel(op: string): string {
  const labels: Record<string, string> = {
    mint_nft: "Mint NFT",
    verify: "Xác thực",
    transfer: "Chuyển NFT",
    revoke: "Thu hồi",
  };
  return labels[op] || op || "Giao dịch";
}

export default function Transactions() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);

  useEffect(() => {
    const fetchTx = async () => {
      setLoading(true);
      try {
        const res = await TransactionService.getAllTransactions();
        setTransactions(res.transactions || []);
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTx();
  }, []);

  const filtered = transactions.filter((tx) => {
    const opType = tx.payload?.op || "";
    const matchSearch =
      (tx.tx_hash || "").toLowerCase().includes(search.toLowerCase()) ||
      (tx.tx_id || "").toLowerCase().includes(search.toLowerCase()) ||
      opType.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || opType === filterType;
    return matchSearch && matchType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Đang tải giao dịch...</span>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h2 className="font-display text-2xl font-bold text-foreground">Giao dịch Blockchain</h2>
        <p className="text-sm text-muted-foreground mt-1">Theo dõi tất cả giao dịch trên mạng EduChain</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <ArrowUpRight className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-foreground">{transactions.filter(t => t.payload?.op === "mint_nft").length}</p>
              <p className="text-xs text-muted-foreground">Mint NFT</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
              <RefreshCw className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-foreground">{transactions.filter(t => t.payload?.op !== "mint_nft").length}</p>
              <p className="text-xs text-muted-foreground">Giao dịch khác</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm theo TX Hash hoặc loại..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="mint_nft">Mint NFT</SelectItem>
            <SelectItem value="verify">Xác thực</SelectItem>
            <SelectItem value="transfer">Chuyển NFT</SelectItem>
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
                  <TableHead>TX Hash</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead className="hidden md:table-cell">From</TableHead>
                  <TableHead className="hidden lg:table-cell">To</TableHead>
                  <TableHead className="hidden sm:table-cell">Thời gian</TableHead>
                  <TableHead>Block</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {transactions.length === 0 ? "Chưa có giao dịch nào" : "Không tìm thấy kết quả"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((tx) => {
                    const opType = tx.payload?.op || "";
                    const Icon = typeIcons[opType] || Activity;
                    return (
                      <TableRow key={tx.tx_id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-primary">{truncateHash(tx.tx_hash || tx.tx_id)}</span>
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground">{getOpLabel(opType)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">{truncateHash(tx.sender_address)}</TableCell>
                        <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground">{truncateHash(tx.recipient_address)}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                          {tx.timestamp ? formatTimeAgo(tx.timestamp) : "-"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {tx.block_id ? truncateHash(tx.block_id) : <Badge variant="outline" className="bg-yellow-400/10 text-yellow-400 border-yellow-400/20 text-xs">Mempool</Badge>}
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
    </motion.div>
  );
}
