import { motion } from "framer-motion";
import { 
  Blocks, 
  Search, 
  Plus, 
  Filter, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  Copy, 
  ExternalLink,
  ShieldCheck,
  Cpu,
  FileCode,
  LayoutGrid
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageContainer, AdminPageHeader, AdminStatCard, itemVariants } from "@/components/admin/AdminShared";
import { toast } from "sonner";

export default function AdminContracts() {
  const contracts = [
    { name: "EduDegree NFT", address: "0x742d9315270cbc1439a110da687c0ef3786363b24", version: "v1.2.0", status: "Active", type: "NFT Core" },
    { name: "Validator Registry", address: "0x912a1234bda1e73a8d6c02b7b95cac47f7380ef", version: "v1.0.5", status: "Active", type: "Governance" },
    { name: "Identity Manager", address: "0xab12ef56c67815b386270f66ddfba66e96b62b6c", version: "v2.0.1", status: "Active", type: "Security" },
    { name: "Treasury Wallet", address: "0x334477884a2d079d6bcda614bc272f6b5eb34d35", version: "v1.0.0", status: "Active", type: "Finance" },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Đã sao chép địa chỉ hợp đồng!");
  };

  return (
    <AdminPageContainer>
      <AdminPageHeader 
        title="Quản lý Hợp đồng thông minh" 
        description="Quản lý và cấu hình các Smart Contracts cốt lõi của mạng lưới EduChain"
      >
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-6 shadow-lg shadow-blue-200">
          <Plus className="h-4 w-4" />
          Triển khai Contract mới
        </Button>
      </AdminPageHeader>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AdminStatCard label="Hợp đồng đang chạy" value={4} icon={CheckCircle2} iconColor="text-green-500" bgColor="bg-green-500/10" />
        <AdminStatCard label="Phát hành mới (tháng)" value={2} icon={Cpu} iconColor="text-blue-500" bgColor="bg-blue-500/10" />
        <AdminStatCard label="Cảnh báo bảo mật" value={0} icon={ShieldCheck} iconColor="text-green-500" bgColor="bg-green-500/10" />
      </motion.div>

      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <Input 
            placeholder="Tìm kiếm hợp đồng theo tên, địa chỉ hoặc loại..." 
            className="pl-11 h-12 bg-white border-slate-100 rounded-xl shadow-sm focus:ring-4 focus:ring-blue-500/10 transition-all" 
          />
        </div>
        <Button variant="outline" className="h-12 px-6 gap-2 border-slate-100 rounded-xl bg-white shadow-sm hover:bg-slate-50">
          <Filter className="h-4 w-4 text-slate-400" />
          Bộ lọc
        </Button>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="overflow-x-auto no-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-slate-50">
                    <TableHead className="py-6 px-8 text-[11px] font-black uppercase tracking-widest text-slate-400">Tên Hợp đồng & Loại</TableHead>
                    <TableHead className="py-6 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Địa chỉ On-chain</TableHead>
                    <TableHead className="py-6 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Phiên bản</TableHead>
                    <TableHead className="py-6 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Trạng thái</TableHead>
                    <TableHead className="py-6 px-8 text-right text-[11px] font-black uppercase tracking-widest text-slate-400">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((c) => (
                    <TableRow key={c.address} className="group border-b border-slate-50 hover:bg-slate-50/30 transition-all duration-300">
                      <TableCell className="py-6 px-8">
                        <div className="flex items-center gap-4">
                          <div className="h-11 w-11 rounded-[14px] bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                            <FileCode className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-sm">{c.name}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{c.type}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-6 px-4">
                        <div className="flex items-center gap-2 group/addr">
                          <code className="text-xs font-mono font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 group-hover/addr:text-blue-600 group-hover/addr:border-blue-100 transition-colors">
                            {c.address.slice(0, 10)}...{c.address.slice(-8)}
                          </code>
                          <button 
                            onClick={() => copyToClipboard(c.address)}
                            className="h-7 w-7 rounded-md flex items-center justify-center text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-all"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="py-6 px-4">
                        <Badge variant="outline" className="font-mono text-[10px] font-bold px-2 py-0.5 border-slate-200 text-slate-500">
                          {c.version}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-6 px-4">
                        <div className="flex items-center gap-2">
                           <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                           <span className="text-xs font-bold text-slate-700">Hoạt động</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-6 px-8 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => toast.info(`Đang mở trình chỉnh sửa cho ${c.name}...`)}
                            className="h-9 w-9 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => toast.info(`Xem chi tiết cấu hình của ${c.name}`)}
                            className="h-9 w-9 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
                          >
                            <LayoutGrid className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => toast.error(`Bạn không có quyền xóa hợp đồng hệ thống: ${c.name}`)}
                            className="h-9 w-9 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div variants={itemVariants} className="p-8 rounded-[32px] bg-blue-600 text-white relative overflow-hidden shadow-2xl shadow-blue-200 mt-6">
         <div className="absolute top-0 right-0 p-8 opacity-10">
           <Blocks className="h-32 w-32" />
         </div>
         <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">Tài liệu kỹ thuật Smart Contracts</h3>
            <p className="text-blue-100 text-sm max-w-2xl mb-6">
              Tất cả các hợp đồng thông minh trên mạng lưới EduChain đều được kiểm tra bảo mật và tối ưu hóa phí gas. 
              Bạn có thể xem mã nguồn và tài liệu kỹ thuật chi tiết tại trang dành cho nhà phát triển.
            </p>
            <Button className="bg-white text-blue-600 hover:bg-blue-50 rounded-xl font-bold">
              Xem tài liệu <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
         </div>
      </motion.div>
    </AdminPageContainer>
  );
}
