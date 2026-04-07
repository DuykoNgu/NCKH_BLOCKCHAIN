import { motion } from "framer-motion";
import { User, Search, Filter, GraduationCap, Mail, Calendar, ShieldCheck, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const students = [
  { id: "std-1", name: "Nguyễn Văn A", email: "vana@gmail.com", major: "Khoa học Máy tính", year: 2024, nftCount: 1, status: "active" },
  { id: "std-2", name: "Trần Thị B", email: "thib@gmail.com", major: "Kế toán", year: 2023, nftCount: 1, status: "active" },
  { id: "std-3", name: "Lê Văn C", email: "vanc@gmail.com", major: "Kỹ thuật Phần mềm", year: 2024, nftCount: 0, status: "active" },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function StudentsPage() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h2 className="font-display text-2xl font-bold text-foreground">Quản lý Sinh viên</h2>
        <p className="text-sm text-muted-foreground mt-1">Danh sách người dùng đã xác thực trong hệ thống</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Tổng sinh viên", value: "1,240", icon: User, color: "text-primary" },
          { label: "Đã có bằng NFT", value: "850", icon: GraduationCap, color: "text-green-400" },
          { label: "Chưa có bằng", value: "390", icon: Mail, color: "text-accent" },
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
          <Input placeholder="Tìm kiếm sinh viên..." className="pl-9" />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Lọc theo khoa
        </Button>
      </motion.div>

      <motion.div variants={item}>
        <Card className="glass-card overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Họ và tên</TableHead>
                  <TableHead>Chuyên ngành</TableHead>
                  <TableHead className="hidden md:table-cell">Năm tốt nghiệp</TableHead>
                  <TableHead className="hidden sm:table-cell">Số bằng NFT</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{student.major}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {student.year}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {student.nftCount} NFTs
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-400/10 text-green-400 border-green-400/20">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Đã xác thực
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
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
