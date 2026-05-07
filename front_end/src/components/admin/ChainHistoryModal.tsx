import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { BlockService, type BlockInfo } from "@/services/blockService";
import { TransactionService, type TransactionInfo } from "@/services/transactionService";
import { motion } from "framer-motion";
import { Clock, Activity, ArrowRightLeft, Database, ExternalLink, ShieldCheck, Box, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ChainHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChainHistoryModal({ isOpen, onClose }: ChainHistoryModalProps) {
  const [blocks, setBlocks] = useState<BlockInfo[]>([]);
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("blocks");

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [blockRes, txRes] = await Promise.all([
        BlockService.getAllBlocks(1, 100),
        TransactionService.getAllTransactions()
      ]);
      
      if (blockRes && blockRes.success) {
        setBlocks(blockRes.blocks || []);
      }
      
      if (txRes && txRes.success) {
        setTransactions(txRes.transactions || []);
      }
    } catch (error) {
      console.error("Failed to fetch chain history:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "N/A";
    const ts = timestamp > 10000000000 ? timestamp : timestamp * 1000;
    
    const now = Date.now();
    const diff = now - ts;
    
    if (diff < 60000) return "Vừa xong";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
    return new Date(ts).toLocaleDateString("vi-VN");
  };

  const truncateHash = (hash?: string, length = 12) => {
    if (!hash) return "N/A";
    return `${hash.slice(0, length)}...${hash.slice(-8)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[1200px] w-[95vw] max-h-[90vh] overflow-hidden bg-white border-none shadow-[0_32px_80px_rgba(0,0,0,0.15)] p-0 flex flex-col rounded-[40px]">
        {/* Header - Premium Clean Design */}
        <DialogHeader className="p-10 pb-8 border-b border-slate-50 bg-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 rounded-[22px] bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-100 ring-8 ring-blue-50">
                <Database className="h-8 w-8 text-white" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-black tracking-tight text-slate-900 font-display flex items-center gap-3">
                  Blockchain Explorer
                  <Badge className="bg-green-50 text-green-600 border-none px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest animate-pulse">
                    Live
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                  Mạng lưới EduChain • Dữ liệu được mã hóa
                </DialogDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-slate-50 p-1.5 rounded-[20px] border border-slate-100">
                <TabsList className="bg-transparent h-auto p-0">
                  <TabsTrigger value="blocks" className="rounded-2xl px-8 py-3 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-xl data-[state=active]:shadow-blue-500/10 font-black text-[11px] uppercase tracking-widest transition-all">
                    Khối (Blocks)
                  </TabsTrigger>
                  <TabsTrigger value="txs" className="rounded-2xl px-8 py-3 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-xl data-[state=active]:shadow-blue-500/10 font-black text-[11px] uppercase tracking-widest transition-all">
                    Giao dịch (Txs)
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </DialogHeader>

        {/* Content - Modern Premium Table */}
        <div className="flex-1 overflow-y-auto p-10 pt-0 no-scrollbar bg-white">
          <Tabs value={activeTab} className="w-full h-full">
            <TabsContent value="blocks" className="m-0 focus-visible:ring-0">
              {loading ? (
                <div className="space-y-6">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-50/50 rounded-[28px] animate-pulse border border-slate-50" />)}
                </div>
              ) : blocks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-40 text-center">
                  <div className="h-28 w-28 rounded-[32px] bg-slate-50 flex items-center justify-center mb-8 border-2 border-dashed border-slate-200 rotate-12">
                    <Box className="h-12 w-12 text-slate-200" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">Không tìm thấy khối</h3>
                  <p className="text-slate-400 font-bold max-w-[340px] mt-3 uppercase tracking-widest text-[10px]">
                    Dữ liệu đang được đồng bộ hóa từ mạng lưới chính
                  </p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {blocks.map((block, idx) => (
                    <motion.div
                      key={block.block_id || idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group bg-slate-50/30 border border-slate-50 p-8 rounded-[32px] hover:bg-white hover:border-blue-500/10 hover:shadow-[0_24px_48px_-12px_rgba(59,130,246,0.08)] transition-all duration-500"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="flex items-center gap-8">
                          <div className="relative">
                            <div className="absolute -inset-2 bg-blue-600/5 rounded-2xl blur-lg group-hover:bg-blue-600/10 transition-all" />
                            <div className="relative h-20 w-20 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl font-black text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                              #{block.index}
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono font-black bg-white px-4 py-2 rounded-xl border border-slate-100 text-slate-600 shadow-sm">
                                {truncateHash(block.block_hash, 24)}
                              </span>
                              <Badge className="bg-slate-900 text-white border-none px-3 py-1 font-black text-[9px] uppercase tracking-widest">Confirmed</Badge>
                            </div>
                            <div className="flex items-center gap-8">
                              <div className="flex items-center gap-2.5 text-[13px] font-black text-slate-700">
                                <Clock className="h-4 w-4 text-blue-500" />
                                {formatTime(block.timestamp)}
                              </div>
                              <div className="flex items-center gap-2.5 text-[13px] font-black text-slate-700">
                                <ArrowRightLeft className="h-4 w-4 text-blue-500" />
                                {block.transactions_count} Giao dịch
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 self-end">
                           <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Validator Node</p>
                            <p className="text-xs font-mono font-black text-slate-900">{block.validator_pubkey?.slice(0, 32)}...</p>
                          </div>
                          <Button variant="ghost" className="h-14 w-14 rounded-full bg-white border border-slate-100 text-slate-300 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-500 shadow-sm">
                            <ExternalLink className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="txs" className="m-0 focus-visible:ring-0">
              <div className="rounded-[32px] border border-slate-100 overflow-hidden bg-slate-50/20">
                <Table>
                  <TableHeader>
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="py-6 px-8 text-[11px] font-black uppercase tracking-widest text-slate-400">Mã Giao Dịch</TableHead>
                      <TableHead className="py-6 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Loại</TableHead>
                      <TableHead className="py-6 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Gửi từ</TableHead>
                      <TableHead className="py-6 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Người nhận</TableHead>
                      <TableHead className="py-6 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Thời gian</TableHead>
                      <TableHead className="py-6 px-8 text-right text-[11px] font-black uppercase tracking-widest text-slate-400">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      [1, 2, 3, 4, 5].map(i => (
                        <TableRow key={i} className="border-slate-50 hover:bg-transparent">
                          <TableCell colSpan={6} className="p-4"><div className="h-8 bg-slate-50 animate-pulse rounded-xl" /></TableCell>
                        </TableRow>
                      ))
                    ) : transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-40 text-center">
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Không tìm thấy giao dịch nào</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((tx, idx) => (
                        <TableRow key={tx.tx_hash || idx} className="group border-slate-50 hover:bg-white transition-colors duration-300">
                          <TableCell className="py-6 px-8">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Activity className="h-4 w-4 text-blue-600" />
                              </div>
                              <span className="text-xs font-mono font-bold text-blue-600 hover:underline cursor-pointer">
                                {truncateHash(tx.tx_hash || tx.tx_id, 10)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-6 px-4">
                            <Badge variant="outline" className="bg-slate-50 border-slate-100 text-[10px] font-bold text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                              {tx.payload?.op || "Transaction"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-6 px-4">
                            <span className="text-xs font-mono text-slate-400 group-hover:text-slate-900 transition-colors">
                              {tx.sender_address === "system" ? "Hệ thống" : truncateHash(tx.sender_address, 8)}
                            </span>
                          </TableCell>
                          <TableCell className="py-6 px-4">
                            <span className="text-xs font-mono text-slate-400 group-hover:text-slate-900 transition-colors">
                               {truncateHash(tx.recipient_address, 8)}
                            </span>
                          </TableCell>
                          <TableCell className="py-6 px-4">
                            <span className="text-xs font-bold text-slate-500">{formatTime(tx.timestamp)}</span>
                          </TableCell>
                          <TableCell className="py-6 px-8 text-right">
                            <Badge className="bg-blue-50 text-blue-600 border-none px-3 py-1 font-black text-[9px] uppercase tracking-widest group-hover:bg-blue-600 group-hover:text-white transition-all">
                              {tx.block_id ? "Succeed" : "Mempool"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer - Premium Dark */}
        <div className="p-10 border-t border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-12">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2">Total Managed Blocks</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{blocks.length}</span>
                <span className="text-xs font-bold text-green-500">+2.4%</span>
              </div>
            </div>
            <div className="w-px h-12 bg-slate-200" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2">Total Verified Txs</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{transactions.length}</span>
                <span className="text-xs font-bold text-blue-500">Live</span>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={fetchData} 
            disabled={loading}
            className="bg-slate-900 hover:bg-blue-600 text-white rounded-[22px] px-12 py-8 font-black uppercase tracking-[0.2em] text-xs transition-all flex gap-4 shadow-2xl shadow-slate-200 hover:shadow-blue-200 group/btn"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''} group-hover/btn:rotate-180 transition-transform duration-700`} />
            Làm mới hệ thống
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
