import { motion } from "framer-motion";
import { Activity, Search, Filter, ExternalLink, ArrowUpRight, ArrowDownLeft, RefreshCw, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminTransactions, truncateHash, formatTimeAgo, getOpLabel } from "@/hooks/useAdminTransactions";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const typeIcons: Record<string, any> = {
  "mint_nft": ArrowUpRight,
  "verify": RefreshCw,
  "transfer": ArrowDownLeft,
  "revoke": ArrowDownLeft,
};

export default function Transactions() {
  const {
    search,
    setSearch,
    filterType,
    setFilterType,
    loading,
    transactions,
    filtered,
    stats
  } = useAdminTransactions();

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

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-foreground">{stats.total}</p>
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
              <p className="text-2xl font-bold font-display text-foreground">{stats.mintCount}</p>
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
              <p className="text-2xl font-bold font-display text-foreground">{stats.otherCount}</p>
              <p className="text-xs text-muted-foreground">Giao dịch khác</p>
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
            <SelectItem value="verify">Xác thực</SelectItem>
            <SelectItem value="transfer">Chuyển NFT</SelectItem>
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
