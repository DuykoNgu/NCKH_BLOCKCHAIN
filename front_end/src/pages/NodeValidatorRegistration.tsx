import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { FileText, Upload, Check, AlertCircle, Loader, Eye, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

interface FormData {
  org_name: string;
  tax_id: string;
  representative: string;
  email: string;
  phone: string;
  address_organization: string;
}

interface UploadResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    org_name: string;
    status: string;
  };
}

export default function NodeValidatorRegistration() {
  const [step, setStep] = useState<"agreement" | "form" | "review">("agreement");
  const [formData, setFormData] = useState<FormData>({
    org_name: "",
    tax_id: "",
    representative: "",
    email: "",
    phone: "",
    address_organization: "",
  });
  const [agreementFile, setAgreementFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPDF, setShowPDF] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.includes("pdf")) {
        setError("Vui lòng chọn file PDF");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        setError("File không được vượt quá 10MB");
        return;
      }
      setAgreementFile(file);
      setError(null);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPdfPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!agreementFile) {
      setError("Vui lòng tải lên file bản cam kết đã ký");
      return;
    }

    if (!formData.org_name || !formData.email || !formData.tax_id) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("agreement_file", agreementFile);
      formDataToSend.append("org_name", formData.org_name);
      formDataToSend.append("tax_id", formData.tax_id);
      formDataToSend.append("representative", formData.representative);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("address_organization", formData.address_organization);

      const response = await fetch("/api/v1/validator-registration", {
        method: "POST",
        body: formDataToSend,
      });

      const result = (await response.json()) as UploadResponse;

      if (!response.ok) {
        throw new Error(result.message || "Đăng ký thất bại");
      }

      setSuccess(true);
      setStep("review");
      setTimeout(() => {
        setFormData({
          org_name: "",
          tax_id: "",
          representative: "",
          email: "",
          phone: "",
          address_organization: "",
        });
        setAgreementFile(null);
        setPdfPreview(null);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi đăng ký");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-4xl mx-auto space-y-6"
      >
        {/* Header */}
        <motion.div variants={item} className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold font-display text-white">Đăng ký Node Validator</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Trở thành một nút kiểm chứng trong hệ thống blockchain giáo dục
          </p>
        </motion.div>

        {/* Steps Indicator */}
        <motion.div variants={item} className="flex justify-center gap-8 mb-8">
          {["agreement", "form", "review"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center font-bold transition-all ${step === s
                    ? "bg-primary text-white"
                    : ["agreement", "form", "review"].indexOf(step) > i
                      ? "bg-primary/30 text-primary"
                      : "bg-slate-700 text-muted-foreground"
                  }`}
              >
                {i + 1}
              </div>
              {i < 2 && (
                <div
                  className={`h-1 w-12 ${["agreement", "form", "review"].indexOf(step) > i ? "bg-primary" : "bg-slate-700"
                    }`}
                />
              )}
            </div>
          ))}
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div variants={item}>
            <Alert className="bg-red-900/20 border-red-500/30">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-400">{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Success Alert */}
        {success && (
          <motion.div variants={item}>
            <Alert className="bg-green-900/20 border-green-500/30">
              <Check className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-400">
                Đăng ký thành công! Vui lòng chờ phê duyệt từ bộ.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Step 1: Agreement */}
        {step === "agreement" && (
          <motion.div variants={item} className="space-y-6">
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Bản Cam Kết Vận Hành Nút Kiểm Chứng Blockchain
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Vui lòng đọc kỹ bản cam kết dưới đây. Bản cam kết này xác định những trách nhiệm
                  và yêu cầu kỹ thuật của bạn khi tham gia hệ thống blockchain giáo dục.
                </p>

                <Dialog open={showPDF} onOpenChange={setShowPDF}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full gap-2">
                      <Eye className="h-4 w-4" />
                      Xem Bản Cam Kết Đầy Đủ (PDF)
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Bản Cam Kết Blockchain - Chi Tiết</DialogTitle>
                    </DialogHeader>
                    <div className="bg-white rounded-lg p-6 space-y-4">
                      <h3 className="font-bold text-lg">
                        BẢN CAM KẾT VẬN HÀNH NÚT KIỂM CHỨNG BLOCKCHAIN
                      </h3>

                      <div className="space-y-3">
                        <p className="text-sm">
                          Nhằm mục tiêu minh bạch hóa việc quản lý và xác thực văn bằng giáo dục đại
                          học thông qua công nghệ Blockchain, Nhà trường đồng ý tham gia mạng lưới
                          với vai trò là Nút kiểm chứng (Validator Node). Bằng bản cam kết này, chúng
                          tôi khẳng định sự hiểu biết và trách nhiệm đối với các nội dung sau:
                        </p>

                        <div className="space-y-2 border-l-4 border-primary/30 pl-4">
                          <h4 className="font-semibold text-sm">
                            Điều 1. Trách nhiệm về dữ liệu và tính trung thực
                          </h4>
                          <p className="text-sm">
                            Nhà trường cam kết chỉ xác thực và đưa lên hệ thống những văn bằng, chứng
                            chỉ đã qua quy trình đối soát hồ sơ gốc tại đơn vị. Tuyệt đối không thực
                            hiện các hành vi gian lận thông tin hoặc cấp phát văn bằng trái quy định
                            pháp luật.
                          </p>
                        </div>

                        <div className="space-y-2 border-l-4 border-primary/30 pl-4">
                          <h4 className="font-semibold text-sm">
                            Điều 2. Trách nhiệm quản lý Chìa khóa bí mật (Private Key)
                          </h4>
                          <p className="text-sm">
                            Nhà trường công nhận mã bí mật dùng để vận hành nút kiểm chứng có giá trị
                            pháp lý tương đương con dấu của đơn vị. Nhà trường chịu trách nhiệm cao
                            nhất trong việc bảo mật chìa khóa này, không để thất lạc hoặc rơi vào tay
                            bên thứ ba.
                          </p>
                        </div>

                        <div className="space-y-2 border-l-4 border-primary/30 pl-4">
                          <h4 className="font-semibold text-sm">
                            Điều 3. Yêu cầu về hạ tầng kỹ thuật
                          </h4>
                          <p className="text-sm mb-2">
                            Để đảm bảo mạng lưới hoạt động liên tục, Nhà trường cam kết chuẩn bị và
                            duy trì thiết bị máy chủ đáp ứng các thông số tối thiểu:
                          </p>
                          <ul className="text-sm space-y-1 list-disc list-inside">
                            <li>Bộ vi xử lý (CPU): Tối thiểu 04 nhân (Cores)</li>
                            <li>Bộ nhớ tạm thời (RAM): Tối thiểu 08 GB</li>
                            <li>Dung lượng lưu trữ (SSD): Tối thiểu 500 GB trống</li>
                            <li>Kết nối mạng: Đường truyền Internet ổn định, hoạt động 24/7</li>
                          </ul>
                        </div>

                        <div className="space-y-2 border-l-4 border-primary/30 pl-4">
                          <h4 className="font-semibold text-sm">Điều 4. Cam kết chung</h4>
                          <p className="text-sm">
                            Nhà trường cam kết vận hành nút kiểm chứng đúng quy trình kỹ thuật do Bộ
                            Giáo dục và Đào tạo hướng dẫn. Trường hợp vi phạm các điều khoản trên, Nhà
                            trường hoàn toàn đồng ý để cơ quan quản lý thu hồi quyền tham gia và chịu
                            các hình thức xử lý theo quy định của pháp luật.
                          </p>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Alert className="bg-blue-900/20 border-blue-500/30">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-blue-200">
                    Bạn cần in bản cam kết này, ký và đóng dấu, sau đó tải lên file PDF đã ký để
                    hoàn thành quá trình đăng ký.
                  </AlertDescription>
                </Alert>

                <Button onClick={() => setStep("form")} className="w-full gap-2 bg-primary hover:bg-primary/90">
                  Tiếp tục
                  <FileText className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Form & Upload */}
        {step === "form" && (
          <motion.div variants={item} className="space-y-6">
            {/* Form Section */}
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle>Thông Tin Tổ Chức</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="org_name" className="text-foreground font-semibold">
                      Tên cơ sở giáo dục <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="org_name"
                      name="org_name"
                      placeholder="VD: Đại học Bách Khoa Hà Nội"
                      value={formData.org_name}
                      onChange={handleInputChange}
                      className="bg-slate-700/30 border-slate-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tax_id" className="text-foreground font-semibold">
                      Mã số thuế (MST) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="tax_id"
                      name="tax_id"
                      placeholder="VD: 0101234567"
                      value={formData.tax_id}
                      onChange={handleInputChange}
                      className="bg-slate-700/30 border-slate-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="representative" className="text-foreground font-semibold">
                      Đại diện pháp lý
                    </Label>
                    <Input
                      id="representative"
                      name="representative"
                      placeholder="Tên người đại diện"
                      value={formData.representative}
                      onChange={handleInputChange}
                      className="bg-slate-700/30 border-slate-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground font-semibold">
                      Số điện thoại
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="0961234567"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="bg-slate-700/30 border-slate-600"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="email" className="text-foreground font-semibold">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="admin@university.edu.vn"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="bg-slate-700/30 border-slate-600"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address_organization" className="text-foreground font-semibold">
                      Địa chỉ
                    </Label>
                    <Input
                      id="address_organization"
                      name="address_organization"
                      placeholder="Địa chỉ cơ sở giáo dục"
                      value={formData.address_organization}
                      onChange={handleInputChange}
                      className="bg-slate-700/30 border-slate-600"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* File Upload Section */}
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Tải lên Bản Cam Kết Đã Ký
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Vui lòng tải lên bản cam kết đã được ký tên và đóng dấu đỏ của tổ chức.
                </p>

                <div
                  className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center hover:border-primary/60 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="font-semibold text-foreground">
                    {agreementFile ? agreementFile.name : "Chọn hoặc kéo thả file PDF"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Tối đa 10MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {pdfPreview && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Xem trước file:</p>
                    <div className="bg-white rounded-lg overflow-hidden">
                      <iframe
                        src={pdfPreview}
                        className="w-full h-96"
                        title="PDF Preview"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAgreementFile(null);
                        setPdfPreview(null);
                      }}
                      className="text-red-500 hover:text-red-600 gap-1"
                    >
                      <X className="h-4 w-4" />
                      Xóa file
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setStep("agreement")}
                className="flex-1"
              >
                Quay lại
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 gap-2 bg-primary hover:bg-primary/90"
              >
                {loading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Gửi Đăng Ký
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Review */}
        {step === "review" && success && (
          <motion.div variants={item} className="space-y-6">
            <Card className="glass-card border-green-500/30 bg-gradient-to-br from-green-900/10 to-transparent">
              <CardContent className="p-8 text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                  <Check className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Đăng ký thành công!</h3>
                  <p className="text-muted-foreground">
                    Hệ thống đã nhận được hồ sơ của bạn. Vui lòng chờ Bộ Giáo dục và Đào tạo phê
                    duyệt (thường trong 3-5 ngày làm việc).
                  </p>
                </div>

                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-left space-y-2">
                  <p className="text-sm font-semibold text-blue-300">
                    📌 Lưu ý quan trọng:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Kiểm tra email để nhận thông báo phê duyệt</li>
                    <li>Chuẩn bị hạ tầng kỹ thuật theo yêu cầu</li>
                    <li>Liên hệ với bộ nếu có thắc mắc</li>
                  </ul>
                </div>

                <Button
                  onClick={() => {
                    setStep("agreement");
                    setSuccess(false);
                  }}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Trở về trang chủ
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
