import { motion } from "framer-motion";
import { Activity, Search, Filter, ExternalLink, ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminTransactions, truncateHash, formatTimeAgo, getOpLabel } from "@/hooks/useAdminTransactions";
import { TablePageSkeleton } from "@/components/admin/AdminSkeletons";
import { AdminPageContainer, AdminPageHeader, AdminStatCard, itemVariants } from "@/components/admin/AdminShared";

const typeIcons: Record<string, any> = {
  "mint_nft": ArrowUpRight,
  "verify": RefreshCw,
  "transfer": ArrowDownLeft,
  "revoke": ArrowDownLeft,
};

export default function Transactions() {
  const {
    search, setSearch, filterType, setFilterType, loading, transactions, filtered, stats
  } = useAdminTransactions();

  if (loading) return <TablePageSkeleton />;

  return (
    <AdminPageContainer>
      <AdminPageHeader 
        title="Giao dịch Blockchain" 
        description="Theo dõi tất cả giao dịch trên mạng EduChain"
      />

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label="Tổng giao dịch" value={stats.total} icon={Activity} />
        <AdminStatCard label="Mint NFT" value={stats.mintCount} icon={ArrowUpRight} iconColor="text-accent" bgColor="bg-accent/20" />
        <AdminStatCard label="Giao dịch khác" value={stats.otherCount} icon={RefreshCw} iconColor="text-muted-foreground" bgColor="bg-secondary" />
      </motion.div>

      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm theo mã hash, loại giao dịch..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[180px]"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Loại" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="mint_nft">Mint NFT</SelectItem>
            <SelectItem value="verify">Xác thực</SelectItem>
            <SelectItem value="transfer">Chuyển NFT</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="glass-card border-none shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã Hash</TableHead><TableHead>Loại</TableHead>
                  <TableHead className="hidden md:table-cell">From</TableHead><TableHead className="hidden lg:table-cell">To</TableHead>
                  <TableHead className="hidden sm:table-cell">Thời gian</TableHead><TableHead>Block</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Không tìm thấy kết quả</TableCell></TableRow>
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
                          <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-muted-foreground" /><span className="text-foreground">{getOpLabel(opType)}</span></div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">{truncateHash(tx.sender_address)}</TableCell>
                        <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground">{truncateHash(tx.recipient_address)}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{tx.timestamp ? formatTimeAgo(tx.timestamp) : "-"}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {tx.block_id ? truncateHash(tx.block_id) : <Badge variant="outline" className="bg-yellow-400/10 text-yellow-400 border-yellow-400/20 text-[10px]">Mempool</Badge>}
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
