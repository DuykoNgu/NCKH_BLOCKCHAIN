import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateWalletProps {
  error: string;
  isLoading: boolean;
  showPassword: boolean;
  password: string;
  confirmPassword: string;
  onPasswordChange: (password: string) => void;
  onConfirmPasswordChange: (password: string) => void;
  onTogglePassword: () => void;
  onCreateWallet: () => void;
  isSchool?: boolean;
  schoolName?: string;
  onSchoolNameChange?: (name: string) => void;
  taxId?: string;
  onTaxIdChange?: (id: string) => void;
  representative?: string;
  onRepresentativeChange?: (rep: string) => void;
  email?: string;
  onEmailChange?: (email: string) => void;
  phone?: string;
  onPhoneChange?: (phone: string) => void;
  onBack: () => void;
}

const CreateWallet = ({
  error,
  isLoading,
  showPassword,
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  onTogglePassword,
  onCreateWallet,
  isSchool,
  schoolName,
  onSchoolNameChange,
  taxId,
  onTaxIdChange,
  representative,
  onRepresentativeChange,
  email,
  onEmailChange,
  phone,
  onPhoneChange,
  onBack,
}: CreateWalletProps) => {
  return (
    <div className="glass-card rounded-2xl p-10 shadow-[0_8px_40px_-12px_hsla(0,0%,0%,0.08)]">
      <div className="flex flex-col">
        <button onClick={onBack} className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 self-start">
          <ArrowLeft size={16} className="mr-1" /> Quay lại
        </button>

        <h2 className="font-display text-xl font-bold text-foreground mb-1">
          {isSchool ? 'Đăng ký Trường học / Tổ chức' : 'Tạo ví mới'}
        </h2>
        <p className="text-sm text-muted-foreground mb-8">
          {isSchool 
            ? 'Đăng ký định danh cho tổ chức cấp phát văn bằng.' 
            : 'Thiết lập mật khẩu mạnh để bảo vệ tài khoản và dữ liệu của bạn.'}
        </p>


        <div className="space-y-6">
          {isSchool && (
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tên trường học / Tổ chức</Label>
                <Input
                  type="text"
                  value={schoolName || ''}
                  onChange={(e) => onSchoolNameChange?.(e.target.value)}
                  placeholder="VD: Trường Đại học Bách Khoa"
                  className="h-12 bg-secondary/50 border-border/50 rounded-xl px-4 text-foreground focus:bg-background transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Mã số thuế / Mã Cơ Sở GD</Label>
                <Input
                  type="text"
                  value={taxId || ''}
                  onChange={(e) => onTaxIdChange?.(e.target.value)}
                  placeholder="VD: 0100684128"
                  className="h-12 bg-secondary/50 border-border/50 rounded-xl px-4 focus:bg-background transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Người đại diện pháp luật</Label>
                <Input
                  type="text"
                  value={representative || ''}
                  onChange={(e) => onRepresentativeChange?.(e.target.value)}
                  placeholder="Họ và tên"
                  className="h-12 bg-secondary/50 border-border/50 rounded-xl px-4 focus:bg-background transition-colors"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email liên hệ</Label>
                  <Input
                    type="email"
                    value={email || ''}
                    onChange={(e) => onEmailChange?.(e.target.value)}
                    placeholder="... @edu.vn"
                    className="h-12 bg-secondary/50 border-border/50 rounded-xl px-4 focus:bg-background transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Số điện thoại</Label>
                  <Input
                    type="tel"
                    value={phone || ''}
                    onChange={(e) => onPhoneChange?.(e.target.value)}
                    placeholder="0912..."
                    className="h-12 bg-secondary/50 border-border/50 rounded-xl px-4 focus:bg-background transition-colors"
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-border/50 mt-4"></div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Mật khẩu ví</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  placeholder="Mật khẩu ít nhất 8 ký tự"
                  className={cn(
                    "h-12 bg-secondary/50 border-border/50 rounded-xl px-4 pr-12 focus:bg-background transition-colors",
                    error && (error.includes('Mật khẩu') || error.includes('khớp')) && "border-destructive/50 bg-destructive/5 ring-destructive/20 focus-visible:ring-destructive"
                  )}
                />
                <button
                  type="button"
                  onClick={onTogglePassword}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Xác nhận mật khẩu</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => onConfirmPasswordChange(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className={cn(
                  "h-12 bg-secondary/50 border-border/50 rounded-xl px-4 focus:bg-background transition-colors",
                  error && error.includes('khớp') && "border-destructive/50 bg-destructive/5 ring-destructive/20 focus-visible:ring-destructive"
                )}
              />
            </div>
            {error && <p className="text-[11px] text-destructive font-medium ml-1 animate-in fade-in slide-in-from-top-1 duration-200">{error}</p>}
          </div>

          <div className="pt-2">
            <Button
              onClick={onCreateWallet}
              disabled={
                isLoading || 
                !password || 
                password.length < 8 || 
                password !== confirmPassword ||
                (isSchool && (!schoolName || !taxId || !representative || !email || !phone))
              }
              className="w-full h-12 rounded-xl font-display font-semibold text-sm shadow-lg shadow-primary/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isSchool ? 'Đang gửi yêu cầu...' : 'Đang tạo ví...'}
                </>
              ) : (
                isSchool ? 'Gửi hồ sơ đăng ký' : 'Tiếp tục tạo ví'
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
        </div>
      </div>
    </div>
  );
};

export default CreateWallet;
