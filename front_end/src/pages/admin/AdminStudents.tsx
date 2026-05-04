import { useState } from "react";
import { motion } from "framer-motion";
import { User, Search, GraduationCap, ShieldCheck, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NFTService } from "@/services/nftService";
import type { NFT } from "@/services/nftService";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

// Derive a unique student list from NFT data (group by owner_address)
function groupByOwner(nfts: NFT[]) {
  const map = new Map<string, { address: string; nfts: NFT[] }>();
  for (const nft of nfts) {
    const addr = nft.recipient_address || "";
    if (!addr) continue;
    if (!map.has(addr)) map.set(addr, { address: addr, nfts: [] });
    map.get(addr)!.nfts.push(nft);
  }
  return Array.from(map.values());
}

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [allNFTs, setAllNFTs] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await NFTService.getAllNFTs();
        setAllNFTs(data.nfts || []);
      } catch (e) {
        console.error("Failed to fetch NFTs:", e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const students = groupByOwner(allNFTs);

  const filtered = students.filter((s) =>
    s.address.toLowerCase().includes(search.toLowerCase())
  );

  const totalWithNFT = students.filter((s) => s.nfts.some((n) => n.is_valid)).length;
  const totalWithout = students.filter((s) => !s.nfts.some((n) => n.is_valid)).length;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h2 className="font-display text-2xl font-bold text-foreground">Quản lý Sinh viên</h2>
        <p className="text-sm text-muted-foreground mt-1">Danh sách người dùng đã nhận bằng cấp trong hệ thống</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Tổng tài khoản có bằng", value: students.length, icon: User, color: "text-primary" },
          { label: "Đang có bằng hợp lệ", value: totalWithNFT, icon: GraduationCap, color: "text-green-400" },
          { label: "Bằng đã thu hồi / Không có", value: totalWithout, icon: AlertCircle, color: "text-accent" },
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

      <motion.div variants={item} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo địa chỉ ví..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </motion.div>

      <motion.div variants={item}>
        <Card className="glass-card overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Địa chỉ ví</TableHead>
                  <TableHead className="hidden md:table-cell">Bằng cấp đang giữ</TableHead>
                  <TableHead className="hidden sm:table-cell">Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span>Đang tải dữ liệu...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                      Chưa có sinh viên nào trong hệ thống
                    </TableCell>
                  </TableRow>
                ) : filtered.map((student) => {
                  const validNFTs = student.nfts.filter((n) => n.is_valid);
                  const hasValid = validNFTs.length > 0;
                  const shortAddr = `${student.address.slice(0, 8)}...${student.address.slice(-6)}`;

                  return (
                    <TableRow key={student.address}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-mono text-foreground">{shortAddr}</p>
                            <p className="text-xs text-muted-foreground">{student.nfts.length} văn bằng tổng</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="space-y-1">
                          {validNFTs.slice(0, 2).map((nft) => (
                            <p key={nft.token_id} className="text-xs text-muted-foreground truncate max-w-[200px]">
                              • {nft.metadata?.degree_type || "Chứng chỉ"}
                            </p>
                          ))}
                          {validNFTs.length > 2 && (
                            <p className="text-xs text-muted-foreground">+{validNFTs.length - 2} bằng khác</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge
                          variant="outline"
                          className={
                            hasValid
                              ? "bg-green-400/10 text-green-400 border-green-400/20"
                              : "bg-destructive/10 text-destructive border-destructive/20"
                          }
                        >
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          {hasValid ? `${validNFTs.length} hợp lệ` : "Không có bằng hợp lệ"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
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
