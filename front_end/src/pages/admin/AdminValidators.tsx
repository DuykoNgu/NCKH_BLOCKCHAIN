import { useState } from "react";
import { motion } from "framer-motion";
import { Search, CheckCircle2, Info, Mail, Phone, User, Building2, Eye, FileText, CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAdminValidators } from "@/hooks/useAdmin";
import { Pagination, usePagination } from "@/components/ui/pagination";

interface Validator {
  address: string;
  org_name?: string;
  tax_id?: string;
  representative?: string;
  email?: string;
  phone?: string;
  created_at?: string;
  agreement_file_url: string;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function AdminValidators() {
  const { 
    search, 
    setSearch, 
    validators, 
    filtered, 
    loading, 
    handleApprove, 
    handleReject 
  } = useAdminValidators();
  
  const { currentPage, setCurrentPage, itemsPerPage, paginate, handlePageSizeChange } = usePagination(10);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h2 className="font-display text-2xl font-bold text-foreground">Phê duyệt Trường (Validator)</h2>
        <p className="text-sm text-muted-foreground mt-1">Xác minh danh tính pháp lý và cấp quyền tham gia mạng lưới cho các cơ sở giáo dục</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-400/20 flex items-center justify-center">
              <Info className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-foreground">{validators.length}</p>
              <p className="text-xs text-muted-foreground">Yêu cầu mới</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Tìm kiếm theo tên trường, địa chỉ ví..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="pl-9" 
        />
      </motion.div>

      <motion.div variants={item}>
        <Card className="glass-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên cơ sở giáo dục</TableHead>
                  <TableHead>Thông tin liên hệ</TableHead>
                  <TableHead>Đại diện pháp luật</TableHead>
                  <TableHead>Địa chỉ ví</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginate(filtered as Validator[]).length > 0 ? (paginate(filtered as Validator[]) as Validator[]).map((v: Validator) => (
                  <TableRow key={v.address}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{v.org_name || "N/A"}</p>
                          <p className="text-xs text-muted-foreground mt-1">MST: {v.tax_id || "Chưa cập nhật"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" /> {v.email || "N/A"}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" /> {v.phone || "N/A"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{v.representative || "N/A"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-primary">{v.address.slice(0, 10)}...{v.address.slice(-6)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* Chi tiết */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                              <Eye className="h-4 w-4" />
                              <span className="hidden sm:inline">Chi tiết</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md glass-card">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Hồ sơ đăng ký Validator
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                                  <Building2 className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-lg">{v.org_name || "Trường Đại học"}</h3>
                                  <p className="text-sm text-muted-foreground font-mono">Ví: {v.address}</p>
                                </div>
                              </div>
                              <div className="grid gap-3 bg-secondary/30 p-4 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Mã số thuế:</span>
                                  <span className="text-sm font-semibold">{v.tax_id || "Không có"}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Người đại diện:</span>
                                  <span className="text-sm font-semibold">{v.representative || "Không có"}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">SĐT liên hệ:</span>
                                  <span className="text-sm font-semibold">{v.phone || "Không có"}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Email:</span>
                                  <span className="text-sm font-semibold">{v.email || "Không có"}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Thời gian nộp:</span>
                                  <span className="text-sm font-semibold flex items-center gap-1">
                                    <CalendarClock className="h-3 w-3" />
                                    {v.created_at || "Vừa xong"}
                                  </span>
                                </div>
                                {v.agreement_file_url && (
                                  <div className="flex items-center justify-between pt-2 border-t border-border">
                                    <span className="text-sm text-muted-foreground">Bản Cam kết:</span>
                                    <Button 
                                      onClick={() => setPdfUrl(v.agreement_file_url)}
                                      variant="outline" 
                                      size="sm" 
                                      className="text-primary hover:bg-primary/10 gap-1"
                                    >
                                      <Eye className="h-4 w-4" />
                                      <span>Xem PDF</span>
                                    </Button>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-2 pt-2">
                                <Button 
                                  onClick={() => handleApprove(v.address)} 
                                  className="w-full bg-green-500 hover:bg-green-600 text-white gap-2"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  Phê duyệt đối tác này
                                </Button>
                                <Button 
                                  onClick={() => handleReject(v.address)} 
                                  variant="outline" 
                                  className="w-full text-destructive hover:bg-destructive/10"
                                >
                                  Từ chối yêu cầu
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button 
                          onClick={() => handleReject(v.address)} 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:bg-destructive/10 px-2 sm:px-3"
                          title="Từ chối"
                        >
                          <span className="sm:hidden">X</span>
                          <span className="hidden sm:inline">Từ chối</span>
                        </Button>
                        <Button 
                          onClick={() => handleApprove(v.address)}
                          size="sm" 
                          className="bg-green-500 hover:bg-green-600 text-white gap-2 px-2 sm:px-3"
                          title="Phê duyệt"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="hidden sm:inline">Phê duyệt</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      {loading ? "Đang tải danh sách..." : "Không có yêu cầu phê duyệt nào"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="px-4 pb-4">
              <Pagination
                currentPage={currentPage}
                totalItems={filtered.length}
                pageSize={itemsPerPage}
                onPageChange={(p) => { setCurrentPage(p); }}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={[5, 10, 20]}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* PDF Viewer Dialog */}
      <Dialog open={pdfUrl !== null} onOpenChange={(open) => !open && setPdfUrl(null)}>
        <DialogContent className="sm:max-w-4xl glass-card max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Xem Bản Cam Kết
            </DialogTitle>
          </DialogHeader>
          <div className="w-full h-[70vh] bg-secondary/30 rounded-lg overflow-hidden border border-border">
            {pdfUrl && (
              <iframe 
                src={pdfUrl}
                className="w-full h-full"
                title="Bản Cam Kết PDF"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
