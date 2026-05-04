import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Search, Plus, Filter, CheckCircle2, Clock, XCircle, Eye, Download, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { NFTService } from "@/services/nftService";
import type { NFT } from "@/services/nftService";

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  verified: { label: "Đã xác thực", icon: CheckCircle2, className: "bg-green-400/10 text-green-400 border-green-400/20" },
  pending: { label: "Đang chờ", icon: Clock, className: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" },
  rejected: { label: "Đã thu hồi", icon: XCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

function truncateHash(hash: string, start = 8, end = 6): string {
  if (!hash || hash.length <= start + end) return hash || '-';
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}

function getNftStatus(nft: NFT): string {
  if (nft.is_valid === false) return "rejected";
  if (nft.issuer_signature) return "verified";
  return "pending";
}

export default function Degrees() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [mintOpen, setMintOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nfts, setNfts] = useState<NFT[]>([]);

  useEffect(() => {
    const fetchNFTs = async () => {
      setLoading(true);
      try {
        const res = await NFTService.getAllNFTs();
        setNfts(res.nfts || []);
      } catch (err) {
        console.error("Failed to fetch NFTs:", err);
        toast.error("Không thể tải danh sách bằng cấp");
      } finally {
        setLoading(false);
      }
    };
    fetchNFTs();
  }, []);

  const degrees = nfts.map((nft) => ({
    id: nft.token_id,
    tokenId: truncateHash(nft.token_id),
    name: nft.metadata?.degree_type || "Chứng chỉ số",
    degree: nft.metadata?.degree_type || "-",
    university: nft.metadata?.institution_address ? truncateHash(nft.metadata.institution_address) : "-",
    date: nft.minted_at ? new Date(nft.minted_at).toLocaleDateString("vi-VN") : "-",
    status: getNftStatus(nft),
    recipient_name: nft.metadata?.student_id || "-",
    metadata: nft.metadata,
    is_valid: nft.is_valid !== false,
  }));

  const filtered = degrees.filter((d) => {
    const name = d.recipient_name || "";
    const degreeType = d.metadata?.degree_type || "";
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) || 
                      degreeType.toLowerCase().includes(search.toLowerCase());
    
    const matchStatus = filterStatus === "all" || d.status === filterStatus;
    
    return matchSearch && matchStatus;
  });

  const handleMint = () => {
    toast.info("Tính năng Mint NFT cần được thực hiện qua API với chữ ký số");
    setMintOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Đang tải bằng cấp NFT...</span>
      </div>
    );
  }

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
              <div className="space-y-2">
                <Label>PDF URL</Label>
                <Input placeholder="https://example.com/cert.pdf" />
              </div>
              <div className="space-y-2">
                <Label>Địa chỉ ví sinh viên (recipient)</Label>
                <Input placeholder="0x..." />
              </div>
              <Button onClick={handleMint} className="w-full">Mint NFT</Button>
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
              <p className="text-2xl font-bold font-display text-foreground">{nfts.length}</p>
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
          <Input placeholder="Tìm kiếm theo loại bằng cấp..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="verified">Đã xác thực</SelectItem>
            <SelectItem value="pending">Đang chờ</SelectItem>
            <SelectItem value="rejected">Đã thu hồi</SelectItem>
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
                  <TableHead>Loại bằng</TableHead>
                  <TableHead className="hidden md:table-cell">Tổ chức</TableHead>
                  <TableHead className="hidden sm:table-cell">Ngày</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {nfts.length === 0 ? "Chưa có NFT nào được phát hành" : "Không tìm thấy kết quả"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((deg) => {
                    const sc = statusConfig[deg.status] || statusConfig.pending;
                    return (
                      <TableRow key={deg.id}>
                        <TableCell className="font-mono text-primary text-sm">{deg.tokenId}</TableCell>
                        <TableCell className="font-medium text-foreground">{deg.degree}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{deg.university}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">{deg.date}</TableCell>
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

