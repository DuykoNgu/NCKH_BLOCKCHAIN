import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Search, Plus, UserCheck, GraduationCap, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { students } from "@/data/admin/mockData";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function Students() {
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase()) || s.major.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => { toast.success("Đã thêm sinh viên mới!"); setAddOpen(false); };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Quản lý Sinh viên</h2>
          <p className="text-sm text-muted-foreground mt-1">Danh sách sinh viên và trạng thái bằng cấp NFT</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />Thêm sinh viên</Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-border">
            <DialogHeader><DialogTitle className="font-display">Thêm sinh viên mới</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Mã sinh viên</Label><Input placeholder="SV00X" /></div>
                <div className="space-y-2"><Label>Họ và tên</Label><Input placeholder="Nhập họ tên..." /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="email@edu.vn" /></div>
                <div className="space-y-2"><Label>Số điện thoại</Label><Input placeholder="09..." /></div>
              </div>
              <div className="space-y-2"><Label>Ngành học</Label><Input placeholder="Nhập ngành học..." /></div>
              <div className="space-y-2">
                <Label>Trường đại học</Label>
                <Select><SelectTrigger><SelectValue placeholder="Chọn trường" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bkhn">ĐH Bách Khoa HN</SelectItem>
                    <SelectItem value="ktqd">ĐH Kinh Tế QD</SelectItem>
                    <SelectItem value="hlu">ĐH Luật Hà Nội</SelectItem>
                    <SelectItem value="nuce">ĐH Xây Dựng</SelectItem>
                    <SelectItem value="hmu">ĐH Y Hà Nội</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAdd} className="w-full">Thêm sinh viên</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass-card"><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center"><Users className="h-5 w-5 text-primary" /></div>
          <div><p className="text-2xl font-bold font-display text-foreground">{students.length}</p><p className="text-xs text-muted-foreground">Tổng sinh viên</p></div>
        </CardContent></Card>
        <Card className="glass-card"><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-400/20 flex items-center justify-center"><UserCheck className="h-5 w-5 text-green-400" /></div>
          <div><p className="text-2xl font-bold font-display text-foreground">{students.filter(s => s.status === "graduated").length}</p><p className="text-xs text-muted-foreground">Đã tốt nghiệp</p></div>
        </CardContent></Card>
        <Card className="glass-card"><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center"><GraduationCap className="h-5 w-5 text-accent" /></div>
          <div><p className="text-2xl font-bold font-display text-foreground">{students.reduce((s, st) => s + st.nftCount, 0)}</p><p className="text-xs text-muted-foreground">NFT đã phát hành</p></div>
        </CardContent></Card>
      </motion.div>

      <motion.div variants={item} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm sinh viên..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </motion.div>

      <motion.div variants={item}>
        <Card className="glass-card overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã SV</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead className="hidden md:table-cell">Ngành</TableHead>
                  <TableHead className="hidden lg:table-cell">Trường</TableHead>
                  <TableHead className="hidden sm:table-cell">Niên khóa</TableHead>
                  <TableHead>NFT</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-primary text-sm">{s.id}</TableCell>
                    <TableCell>
                      <div><p className="font-medium text-foreground">{s.name}</p><p className="text-xs text-muted-foreground hidden sm:block">{s.email}</p></div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{s.major}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{s.university}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{s.year}</TableCell>
                    <TableCell><Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{s.nftCount}</Badge></TableCell>
                    <TableCell>
                      <Badge variant="outline" className={s.status === "graduated" ? "bg-green-400/10 text-green-400 border-green-400/20" : "bg-yellow-400/10 text-yellow-400 border-yellow-400/20"}>
                        {s.status === "graduated" ? "Tốt nghiệp" : "Đang học"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"><Eye className="h-4 w-4" /></Button>
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
