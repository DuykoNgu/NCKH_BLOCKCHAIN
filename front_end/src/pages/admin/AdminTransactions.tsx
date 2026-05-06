import { motion } from "framer-motion";
import { 
  Activity, 
  Search, 
  Filter, 
  ExternalLink, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw,
  Clock,
  User,
  Zap,
  Box
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminTransactions, truncateHash, formatTimeAgo, getOpLabel } from "@/hooks/useAdminTransactions";
import { TablePageSkeleton } from "@/components/admin/AdminSkeletons";
import { AdminPageContainer, AdminPageHeader, AdminStatCard, itemVariants } from "@/components/admin/AdminShared";
import { Button } from "@/components/ui/button";

const typeIcons: Record<string, any> = {
  "mint_nft": Zap,
  "verify": RefreshCw,
  "transfer": ArrowUpRight,
  "revoke": ArrowDownLeft,
};

const typeColors: Record<string, string> = {
  "mint_nft": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "verify": "bg-green-500/10 text-green-500 border-green-500/20",
  "transfer": "bg-purple-500/10 text-purple-500 border-purple-500/20",
  "revoke": "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function Transactions() {
  const {
    search, setSearch, filterType, setFilterType, loading, filtered, stats
  } = useAdminTransactions();

  if (loading) return <TablePageSkeleton />;

  return (
    <AdminPageContainer>
      <AdminPageHeader 
        title="Giao dịch Blockchain" 
        description="Theo dõi tất cả giao dịch trên mạng EduChain theo thời gian thực"
      >
         <Button variant="outline" className="gap-2 bg-white/50 backdrop-blur-sm border-slate-200">
           <RefreshCw className="h-4 w-4" />
           Làm mới dữ liệu
         </Button>
      </AdminPageHeader>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatCard label="Tổng giao dịch" value={stats.total} icon={Activity} />
        <AdminStatCard label="Phát hành NFT" value={stats.mintCount} icon={Zap} iconColor="text-blue-500" bgColor="bg-blue-500/10" />
        <AdminStatCard label="Hệ thống" value={stats.otherCount} icon={RefreshCw} iconColor="text-slate-500" bgColor="bg-slate-100" />
        <AdminStatCard label="Trạng thái Mạng" value="Ổn định" icon={Activity} iconColor="text-green-500" bgColor="bg-green-500/10" />
      </motion.div>

      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <Input 
            placeholder="Tìm kiếm mã giao dịch, địa chỉ ví, hoặc loại..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-11 h-12 bg-white/80 border-slate-100 shadow-sm focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl" 
          />
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-12 w-full sm:w-[200px] bg-white border-slate-100 shadow-sm rounded-xl px-4">
              <Filter className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Tất cả loại" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả giao dịch</SelectItem>
              <SelectItem value="mint_nft">Phát hành NFT</SelectItem>
              <SelectItem value="verify">Xác thực bằng</SelectItem>
              <SelectItem value="transfer">Chuyển nhượng</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[28px] overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="overflow-x-auto no-scrollbar">
              <Table>
                <TableHeader className="border-b border-slate-50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="py-6 px-8 text-[11px] font-black uppercase tracking-widest text-slate-400">Giao dịch (TX Hash)</TableHead>
                    <TableHead className="py-6 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Loại hoạt động</TableHead>
                    <TableHead className="py-6 px-4 hidden md:table-cell text-[11px] font-black uppercase tracking-widest text-slate-400">Người gửi</TableHead>
                    <TableHead className="py-6 px-4 hidden lg:table-cell text-[11px] font-black uppercase tracking-widest text-slate-400">Người nhận</TableHead>
                    <TableHead className="py-6 px-4 hidden sm:table-cell text-[11px] font-black uppercase tracking-widest text-slate-400">Thời gian</TableHead>
                    <TableHead className="py-6 px-8 text-right text-[11px] font-black uppercase tracking-widest text-slate-400">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-24">
                        <div className="flex flex-col items-center justify-center opacity-30">
                           <Activity className="h-12 w-12 mb-4" />
                           <p className="font-bold uppercase tracking-widest text-xs">Không tìm thấy giao dịch nào</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((tx) => {
                      const opType = tx.payload?.op || "";
                      const Icon = typeIcons[opType] || Activity;
                      const badgeStyle = typeColors[opType] || "bg-slate-100 text-slate-600 border-slate-200";
                      
                      return (
                        <TableRow key={tx.tx_id} className="group border-b border-slate-50 hover:bg-slate-50/30 transition-all duration-300">
                          <TableCell className="py-6 px-8">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-sm font-bold text-slate-900">{truncateHash(tx.tx_hash || tx.tx_id, 8, 6)}</span>
                                  <ExternalLink className="h-3 w-3 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirmed</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-6 px-4">
                            <Badge variant="outline" className={`border-none rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-wider ${badgeStyle}`}>
                              {getOpLabel(opType)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-6 px-4 hidden md:table-cell">
                            <div className="flex items-center gap-2">
                               <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center">
                                 <User className="h-3 w-3 text-slate-400" />
                               </div>
                               <span className="font-mono text-xs font-bold text-slate-500 group-hover:text-slate-900 transition-colors">
                                 {tx.sender_address === "system" ? "Hệ thống" : truncateHash(tx.sender_address, 6, 4)}
                               </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-6 px-4 hidden lg:table-cell">
                             <div className="flex items-center gap-2">
                               <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center">
                                 <User className="h-3 w-3 text-slate-400" />
                               </div>
                               <span className="font-mono text-xs font-bold text-slate-500 group-hover:text-slate-900 transition-colors">
                                 {truncateHash(tx.recipient_address, 6, 4)}
                               </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-6 px-4 hidden sm:table-cell">
                            <div className="flex items-center gap-2 text-slate-400 font-bold text-xs">
                              <Clock className="h-3.5 w-3.5" />
                              {tx.timestamp ? formatTimeAgo(tx.timestamp) : "-"}
                            </div>
                          </TableCell>
                          <TableCell className="py-6 px-8 text-right">
                             {tx.block_id ? (
                               <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl border border-blue-100">
                                 <Box className="h-3 w-3" />
                                 <span className="text-[10px] font-black uppercase tracking-widest">Block #{tx.block_id.slice(0, 4)}</span>
                               </div>
                             ) : (
                               <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-100 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest animate-pulse">
                                 Mempool
                               </Badge>
                             )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AdminPageContainer>
  );
}
