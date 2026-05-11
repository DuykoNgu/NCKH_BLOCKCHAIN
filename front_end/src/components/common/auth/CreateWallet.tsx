import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck, FileUp, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { schoolRegisterSchema, createWalletSchema } from '@/types/auth.schema';

interface CreateWalletProps {
  isLoading: boolean;
  isSchool?: boolean;
  isImporting?: boolean;
  fullName?: string;
  onFullNameChange?: (val: string) => void;
  email?: string;
  onEmailChange?: (val: string) => void;
  schoolName?: string;
  onSchoolNameChange?: (val: string) => void;
  taxId?: string;
  onTaxIdChange?: (val: string) => void;
  representative?: string;
  onRepresentativeChange?: (val: string) => void;
  phone?: string;
  onPhoneChange?: (val: string) => void;
  selectedFile?: File | null;
  onSelectedFileChange?: (file: File | null) => void;
  onSubmit: (values: any) => void;
  onBack: () => void;
}

const CreateWallet = ({
  isLoading,
  isSchool,
  isImporting,
  fullName,
  onFullNameChange,
  email,
  onEmailChange,
  schoolName,
  onSchoolNameChange,
  taxId,
  onTaxIdChange,
  representative,
  onRepresentativeChange,
  phone,
  onPhoneChange,
  selectedFile: propSelectedFile,
  onSelectedFileChange,
  onSubmit,
  onBack,
}: CreateWalletProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(propSelectedFile || null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<any>({
    resolver: zodResolver(isSchool ? schoolRegisterSchema : createWalletSchema),
    mode: "onChange",
    defaultValues: {
      fullName: fullName || '',
      email: email || '',
      schoolName: schoolName || '',
      taxId: taxId || '',
      representative: representative || '',
      phone: phone || '',
      password: '',
      confirmPassword: '',
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      onSelectedFileChange?.(file);
    } else {
      alert('Vui lòng chọn file PDF');
      setSelectedFile(null);
      onSelectedFileChange?.(null);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-10 shadow-[0_8px_40px_-12px_hsla(0,0%,0%,0.08)]">
      <div className="flex flex-col">
        <button onClick={onBack} className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 self-start">
          <ArrowLeft size={16} className="mr-1" /> Quay lại
        </button>

        <h2 className="font-display text-xl font-bold text-foreground mb-1">
          {isSchool ? 'Đăng ký Trường học / Tổ chức' : (isImporting ? 'Thiết lập mật khẩu thiết bị' : 'Tạo ví mới')}
        </h2>
        <p className="text-sm text-muted-foreground mb-8">
          {isSchool
            ? 'Đăng ký định danh cho tổ chức cấp phát văn bằng.'
            : (isImporting 
              ? 'Mật khẩu dùng để bảo mật và đăng nhập nhanh trên thiết bị này.' 
              : 'Thiết lập mật khẩu mạnh để bảo vệ tài khoản và dữ liệu của bạn.')}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {isSchool ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tên trường học / Tổ chức</Label>
                <Input
                  {...register("schoolName", { onChange: (e) => onSchoolNameChange?.(e.target.value) })}
                  placeholder="VD: Trường Đại học Bách Khoa"
                  className={cn("h-12 bg-secondary/50 border-border/50 rounded-xl px-4 text-foreground focus:bg-background transition-colors", errors.schoolName && "border-destructive/50")}
                />
                {errors.schoolName && <p className="text-[10px] text-destructive font-bold">{(errors.schoolName.message as any)?.toString()}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Mã số thuế / Mã Cơ Sở GD</Label>
                <Input
                  {...register("taxId", { onChange: (e) => onTaxIdChange?.(e.target.value) })}
                  placeholder="VD: 0100684128"
                  className={cn("h-12 bg-secondary/50 border-border/50 rounded-xl px-4 focus:bg-background transition-colors", errors.taxId && "border-destructive/50")}
                />
                {errors.taxId && <p className="text-[10px] text-destructive font-bold">{(errors.taxId.message as any)?.toString()}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Người đại diện pháp luật</Label>
                <Input
                  {...register("representative", { onChange: (e) => onRepresentativeChange?.(e.target.value) })}
                  placeholder="Họ và tên"
                  className={cn("h-12 bg-secondary/50 border-border/50 rounded-xl px-4 focus:bg-background transition-colors", errors.representative && "border-destructive/50")}
                />
                {errors.representative && <p className="text-[10px] text-destructive font-bold">{(errors.representative.message as any)?.toString()}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email liên hệ</Label>
                  <Input
                    {...register("email", { onChange: (e) => onEmailChange?.(e.target.value) })}
                    placeholder="... @edu.vn"
                    className={cn("h-12 bg-secondary/50 border-border/50 rounded-xl px-4 focus:bg-background transition-colors", errors.email && "border-destructive/50")}
                  />
                  {errors.email && <p className="text-[10px] text-destructive font-bold">{(errors.email.message as any)?.toString()}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Số điện thoại</Label>
                  <Input
                    {...register("phone", { onChange: (e) => onPhoneChange?.(e.target.value) })}
                    placeholder="0912..."
                    className={cn("h-12 bg-secondary/50 border-border/50 rounded-xl px-4 focus:bg-background transition-colors", errors.phone && "border-destructive/50")}
                  />
                  {errors.phone && <p className="text-[10px] text-destructive font-bold">{(errors.phone.message as any)?.toString()}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  📎 Tải lên Ban Cam kết Blockchain (PDF)
                </Label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="agreement-file"
                  />
                  <label
                    htmlFor="agreement-file"
                    className={cn(
                      "h-12 bg-secondary/50 border-2 border-dashed border-border/50 rounded-xl px-4 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors",
                      selectedFile && "border-primary/50 bg-primary/5"
                    )}
                  >
                    {selectedFile ? (
                      <div className="flex items-center gap-2 text-sm text-primary font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        {selectedFile.name}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileUp className="w-4 h-4" />
                        Chọn file PDF
                      </div>
                    )}
                  </label>
                </div>
                <p className="text-[10px] text-muted-foreground">Tối đa 10MB, định dạng PDF</p>
              </div>
            </div>
          ) : (
            !isImporting && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tên hiển thị</Label>
                  <Input
                    {...register("fullName", { onChange: (e) => onFullNameChange?.(e.target.value) })}
                    placeholder="Họ và tên của bạn"
                    className={cn("h-12 bg-secondary/50 border-border/50 rounded-xl px-4 text-foreground focus:bg-background transition-colors", errors.fullName && "border-destructive/50")}
                  />
                  {errors.fullName && <p className="text-[10px] text-destructive font-bold">{(errors.fullName.message as any)?.toString()}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</Label>
                  <Input
                    {...register("email", { onChange: (e) => onEmailChange?.(e.target.value) })}
                    type="email"
                    placeholder="Email của bạn (Bắt buộc)"
                    className={cn("h-12 bg-secondary/50 border-border/50 rounded-xl px-4 text-foreground focus:bg-background transition-colors", errors.email && "border-destructive/50")}
                  />
                  {errors.email && <p className="text-[10px] text-destructive font-bold">{(errors.email.message as any)?.toString()}</p>}
                </div>
              </div>
            )
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Mật khẩu ví</Label>
              <div className="relative">
                <Input
                  {...register("password")}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mật khẩu ít nhất 8 ký tự"
                  autoComplete="new-password"
                  className={cn(
                    "h-12 bg-secondary/50 border-border/50 rounded-xl px-4 pr-12 focus:bg-background transition-colors",
                    errors.password && "border-destructive/50 ring-destructive/20"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-[10px] text-destructive font-bold">{(errors.password.message as any)?.toString()}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Xác nhận mật khẩu</Label>
              <Input
                {...register("confirmPassword")}
                type="password"
                placeholder="Nhập lại mật khẩu"
                autoComplete="new-password"
                className={cn(
                  "h-12 bg-secondary/50 border-border/50 rounded-xl px-4 focus:bg-background transition-colors",
                  errors.confirmPassword && "border-destructive/50 ring-destructive/20"
                )}
              />
              {errors.confirmPassword && <p className="text-[10px] text-destructive font-bold">{(errors.confirmPassword.message as any)?.toString()}</p>}
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isLoading || !isValid}
              className="w-full h-12 rounded-xl font-display font-semibold text-sm shadow-lg shadow-primary/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isSchool ? 'Đang gửi yêu cầu...' : (isImporting ? 'Đang thiết lập...' : 'Đang tạo ví...')}
                </>
              ) : (
                <>
                  {isSchool ? 'Gửi hồ sơ đăng ký' : (isImporting ? 'Hoàn tất thiết lập' : 'Tiếp tục tạo ví')}
                  {!isLoading && <ShieldCheck size={16} className="ml-2" />}
                </>
              )}
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-[10px] text-amber-600/80 leading-relaxed">
                Mật khẩu này dùng để mã hóa ví của bạn trên trình duyệt này. EduChain không lưu trữ mật khẩu của bạn.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWallet;
