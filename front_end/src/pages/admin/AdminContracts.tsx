import { motion } from "framer-motion";
import { FileCode, Shield, Activity, Copy, ExternalLink, Search, Filter, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const contracts = [
  { id: "0x1", name: "AccountManager", type: "Core", version: "1.0.0", status: "active", lastUpdate: "1 ngày trước", address: "0x0000000000000000000000000000000000000001" },
  { id: "0x2", name: "NFTDegree", type: "Asset", version: "1.2.0", status: "active", lastUpdate: "2 giờ trước", address: "0x0000000000000000000000000000000000000002" },
  { id: "0x3", name: "ValidatorRegistry", type: "Governance", version: "1.0.1", status: "active", lastUpdate: "5 giờ trước", address: "0x0000000000000000000000000000000000000003" },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function ContractsPage() {
  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast.success("Đã sao chép địa chỉ hợp đồng!");
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">Hợp đồng thông minh</h2>
            <p className="text-sm text-muted-foreground mt-1">Quản lý và giám sát các smart contract cốt lõi của hệ thống</p>
          </div>
          <Button className="gap-2">
            <FileCode className="h-4 w-4" />
            Triển khai mới
          </Button>
        </div>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Tổng hợp đồng", value: contracts.length, icon: FileCode, color: "text-primary" },
          { label: "Đang hoạt động", value: "3", icon: Shield, color: "text-green-400" },
          { label: "Tổng tương tác", value: "1,637", icon: Activity, color: "text-accent" },
        ].map((stat) => (
          <Card key={stat.label} className="glass-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg bg-secondary flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <motion.div variants={item} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm hợp đồng..." className="pl-9" />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Lọc
        </Button>
      </motion.div>

      <motion.div variants={item}>
        <Card className="glass-card overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên hợp đồng</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead className="hidden md:table-cell">Địa chỉ</TableHead>
                  <TableHead className="hidden sm:table-cell">Phiên bản</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                          <FileCode className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{contract.name}</p>
                          <p className="text-xs text-muted-foreground">{contract.lastUpdate}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                        {contract.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {contract.address.slice(0, 6)}...{contract.address.slice(-4)}
                        </span>
                        <button onClick={() => copyAddress(contract.address)} className="text-muted-foreground hover:text-primary">
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-xs font-mono">v{contract.version}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-400/10 text-green-400 border-green-400/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
