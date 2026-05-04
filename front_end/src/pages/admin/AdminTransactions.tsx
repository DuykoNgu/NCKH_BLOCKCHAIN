import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Search, Filter, ExternalLink, ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminService } from "@/services/adminService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { transactions } from "@/data/admin/mockData";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const typeIcons: Record<string, typeof ArrowUpRight> = {
  "Mint NFT": ArrowUpRight,
  "Xác thực": RefreshCw,
  "Transfer": ArrowDownLeft,
  "Cập nhật metadata": RefreshCw,
  "Revoke": ArrowDownLeft,
};

export default function Transactions() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const filtered = transactions.filter((tx) => {
    const matchSearch = tx.hash.toLowerCase().includes(search.toLowerCase()) || tx.type.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || tx.type === filterType;
    return matchSearch && matchType;
  });

  const totalGas = transactions.reduce((sum, tx) => sum + parseFloat(tx.gas), 0).toFixed(4);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h2 className="font-display text-2xl font-bold text-foreground">Giao dịch Blockchain</h2>
        <p className="text-sm text-muted-foreground mt-1">Theo dõi tất cả giao dịch trên smart contract</p>
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
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <ArrowUpRight className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-foreground">{transactions.filter(t => t.status === "success").length}</p>
              <p className="text-xs text-muted-foreground">Thành công</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
              <RefreshCw className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display gradient-text">{totalGas} ETH</p>
              <p className="text-xs text-muted-foreground">Tổng Gas</p>
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
            <SelectItem value="Mint NFT">Mint NFT</SelectItem>
            <SelectItem value="Xác thực">Xác thực</SelectItem>
            <SelectItem value="Transfer">Transfer</SelectItem>
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
                  <TableHead className="hidden lg:table-cell">Block</TableHead>
                  <TableHead>Gas</TableHead>
                  <TableHead className="hidden sm:table-cell">Thời gian</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((tx) => {
                  const Icon = typeIcons[tx.type] || Activity;
                  return (
                    <TableRow key={tx.hash}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-primary">{tx.hash}</span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">{tx.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">{tx.from}</TableCell>
                      <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground">{tx.block}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-foreground">{tx.gas}</p>
                          <p className="text-xs text-muted-foreground">{tx.gasUsd}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{tx.time}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={tx.status === "success" ? "bg-green-400/10 text-green-400 border-green-400/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
                          {tx.status === "success" ? "Thành công" : "Thất bại"}
                        </Badge>
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
