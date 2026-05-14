import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Mail,
  Phone,
  Eye,
  Download,
  AlertCircle,
  Loader,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ValidatorRegistration {
  id: string;
  org_name: string;
  tax_id: string;
  representative: string;
  email: string;
  phone: string;
  address_organization: string;
  agreement_file_url: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  admin_notes?: string;
  approved_at?: string;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function AdminValidatorRegistrations() {
  const [registrations, setRegistrations] = useState<ValidatorRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedReg, setSelectedReg] = useState<ValidatorRegistration | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/v1/validator-registrations");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = (await response.json()) as ValidatorRegistration[];
      setRegistrations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedReg) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/v1/validator-registrations/${selectedReg.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_notes: adminNotes }),
      });

      if (!response.ok) throw new Error("Phê duyệt thất bại");

      setSuccess("Đã phê duyệt đơn đăng ký");
      setAdminNotes("");
      setSelectedReg(null);
      fetchRegistrations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi phê duyệt");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReg || !adminNotes.trim()) {
      setError("Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/v1/validator-registrations/${selectedReg.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: adminNotes }),
      });

      if (!response.ok) throw new Error("Từ chối thất bại");

      setSuccess("Đã từ chối đơn đăng ký");
      setAdminNotes("");
      setSelectedReg(null);
      fetchRegistrations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi từ chối");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRegistrations = {
    pending: registrations.filter(
      (r) =>
        r.status === "pending" &&
        (r.org_name.toLowerCase().includes(search.toLowerCase()) ||
          r.tax_id.includes(search) ||
          r.email.toLowerCase().includes(search.toLowerCase()))
    ),
    approved: registrations.filter(
      (r) =>
        r.status === "approved" &&
        (r.org_name.toLowerCase().includes(search.toLowerCase()) ||
          r.tax_id.includes(search) ||
          r.email.toLowerCase().includes(search.toLowerCase()))
    ),
    rejected: registrations.filter(
      (r) =>
        r.status === "rejected" &&
        (r.org_name.toLowerCase().includes(search.toLowerCase()) ||
          r.tax_id.includes(search) ||
          r.email.toLowerCase().includes(search.toLowerCase()))
    ),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item}>
        <h2 className="font-display text-2xl font-bold text-foreground">Đơn Đăng Ký Node Validator</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Xác minh và phê duyệt các đơn đăng ký trở thành nút kiểm chứng blockchain
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-400/20 flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-foreground">{filteredRegistrations.pending.length}</p>
              <p className="text-xs text-muted-foreground">Chờ phê duyệt</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-400/20 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-foreground">{filteredRegistrations.approved.length}</p>
              <p className="text-xs text-muted-foreground">Đã phê duyệt</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-400/20 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-foreground">{filteredRegistrations.rejected.length}</p>
              <p className="text-xs text-muted-foreground">Bị từ chối</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search */}
      <motion.div variants={item}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm theo tên, MST, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </motion.div>

      {/* Alerts */}
      {error && (
        <motion.div variants={item}>
          <Alert className="bg-red-900/20 border-red-500/30">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {success && (
        <motion.div variants={item}>
          <Alert className="bg-green-900/20 border-green-500/30">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-400">{success}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div variants={item}>
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">Chờ phê duyệt ({filteredRegistrations.pending.length})</TabsTrigger>
            <TabsTrigger value="approved">Đã phê duyệt ({filteredRegistrations.approved.length})</TabsTrigger>
            <TabsTrigger value="rejected">Bị từ chối ({filteredRegistrations.rejected.length})</TabsTrigger>
          </TabsList>

          {/* Pending Tab */}
          <TabsContent value="pending" className="space-y-4">
            {filteredRegistrations.pending.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="p-8 text-center text-muted-foreground">
                  Không có đơn đăng ký nào chờ phê duyệt
                </CardContent>
              </Card>
            ) : (
              filteredRegistrations.pending.map((reg) => (
                <RegistrationCard
                  key={reg.id}
                  registration={reg}
                  onSelect={() => setSelectedReg(reg)}
                />
              ))
            )}
          </TabsContent>

          {/* Approved Tab */}
          <TabsContent value="approved" className="space-y-4">
            {filteredRegistrations.approved.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="p-8 text-center text-muted-foreground">
                  Không có đơn đăng ký nào được phê duyệt
                </CardContent>
              </Card>
            ) : (
              filteredRegistrations.approved.map((reg) => (
                <RegistrationCard
                  key={reg.id}
                  registration={reg}
                  onSelect={() => setSelectedReg(reg)}
                  disabled
                />
              ))
            )}
          </TabsContent>

          {/* Rejected Tab */}
          <TabsContent value="rejected" className="space-y-4">
            {filteredRegistrations.rejected.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="p-8 text-center text-muted-foreground">
                  Không có đơn đăng ký nào bị từ chối
                </CardContent>
              </Card>
            ) : (
              filteredRegistrations.rejected.map((reg) => (
                <RegistrationCard
                  key={reg.id}
                  registration={reg}
                  onSelect={() => setSelectedReg(reg)}
                  disabled
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedReg} onOpenChange={() => setSelectedReg(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn đăng ký</DialogTitle>
          </DialogHeader>

          {selectedReg && (
            <div className="space-y-6">
              {/* Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Tên tổ chức</Label>
                  <p className="font-semibold text-foreground mt-1">{selectedReg.org_name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">MST</Label>
                  <p className="font-semibold text-foreground mt-1">{selectedReg.tax_id}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Đại diện pháp lý</Label>
                  <p className="font-semibold text-foreground mt-1">{selectedReg.representative || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-semibold text-foreground mt-1">{selectedReg.email}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Địa chỉ</Label>
                  <p className="font-semibold text-foreground mt-1">{selectedReg.address_organization || "N/A"}</p>
                </div>
              </div>

              {/* PDF Viewer */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Bản cam kết đã ký</Label>
                <div className="bg-white rounded-lg overflow-hidden">
                  <iframe
                    src={selectedReg.agreement_file_url}
                    className="w-full h-96"
                    title="Signed Agreement"
                  />
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-2 gap-2"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = selectedReg.agreement_file_url;
                    link.download = `agreement_${selectedReg.id}.pdf`;
                    link.click();
                  }}
                >
                  <Download className="h-4 w-4" />
                  Tải về
                </Button>
              </div>

              {/* Admin Actions */}
              {selectedReg.status === "pending" && (
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <Label htmlFor="admin-notes" className="text-foreground font-semibold">
                      Ghi chú của Admin
                    </Label>
                    <Textarea
                      id="admin-notes"
                      placeholder="Nhập ghi chú hoặc lý do từ chối..."
                      value={adminNotes}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAdminNotes(e.target.value)}
                      className="mt-2 bg-slate-700/30 border-slate-600"
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedReg(null)}
                      className="flex-1"
                    >
                      Hủy
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={actionLoading}
                      onClick={handleReject}
                      className="flex-1"
                    >
                      {actionLoading ? <Loader className="h-4 w-4 animate-spin" /> : "Từ chối"}
                    </Button>
                    <Button
                      disabled={actionLoading}
                      onClick={handleApprove}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {actionLoading ? <Loader className="h-4 w-4 animate-spin" /> : "Phê duyệt"}
                    </Button>
                  </div>
                </div>
              )}

              {selectedReg.status === "approved" && (
                <Alert className="bg-green-900/20 border-green-500/30">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-400">
                    Đơn này đã được phê duyệt lúc {new Date(selectedReg.approved_at || "").toLocaleString("vi-VN")}
                  </AlertDescription>
                </Alert>
              )}

              {selectedReg.status === "rejected" && (
                <Alert className="bg-red-900/20 border-red-500/30">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-400">
                    Lý do từ chối: {selectedReg.admin_notes}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// Registration Card Component
function RegistrationCard({
  registration,
  onSelect,
  disabled = false,
}: {
  registration: ValidatorRegistration;
  onSelect: () => void;
  disabled?: boolean;
}) {
  const statusConfig = {
    pending: { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-400/20", label: "Chờ phê duyệt" },
    approved: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-400/20", label: "Đã phê duyệt" },
    rejected: { icon: XCircle, color: "text-red-400", bg: "bg-red-400/20", label: "Bị từ chối" },
  };

  const config = statusConfig[registration.status];
  const StatusIcon = config.icon;

  return (
    <Card className={`glass-card cursor-pointer transition-all hover:border-primary/50 ${disabled ? "opacity-75" : ""}`} onClick={onSelect}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`h-12 w-12 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
            <StatusIcon className={`h-6 w-6 ${config.color}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-semibold text-foreground truncate">{registration.org_name}</h3>
                <p className="text-xs text-muted-foreground">MST: {registration.tax_id}</p>
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-700 text-slate-200 whitespace-nowrap">
                {config.label}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {registration.email}
              </div>
              {registration.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {registration.phone}
                </div>
              )}
              <div className="col-span-2 md:col-span-1 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {new Date(registration.created_at).toLocaleDateString("vi-VN")}
              </div>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={() => onSelect()} className="flex-shrink-0 gap-1">
            <Eye className="h-4 w-4" />
            Chi tiết
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
