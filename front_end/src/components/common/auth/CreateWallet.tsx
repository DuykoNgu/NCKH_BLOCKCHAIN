import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { TrongDongDivider } from '@/components/common/TrongDongWatermark';

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
  isImporting?: boolean;
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
  fullName?: string;
  onFullNameChange?: (name: string) => void;
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
  isImporting,
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
  fullName,
  onFullNameChange,
  onBack,
}: CreateWalletProps) => {
  return (
    <div className="relative z-10 w-full max-w-md mx-4">
      <div className="glass-card rounded-2xl p-10 shadow-[0_8px_40px_-12px_hsla(0,0%,0%,0.08)]">
          <div className="flex flex-col">
            <button onClick={onBack} className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 self-start">
              <ArrowLeft size={16} className="mr-1" /> Quay lại
            </button>

            <h2 className="font-display text-xl font-bold text-foreground mb-1">
              {isSchool ? 'Đăng ký Trường học / Tổ chức' : (isImporting ? 'Thiết lập mật khẩu thiết bị' : 'Tạo mật khẩu')}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {isSchool 
                ? 'Đăng ký định danh cho tổ chức cấp phát văn bằng.' 
                : (isImporting 
                  ? 'Mật khẩu dùng để bảo mật và đăng nhập nhanh trên thiết bị này.' 
                  : 'Mật khẩu dùng để bảo mật tài khoản trên thiết bị này.')}
            </p>

            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Full Name & Email fields — shown for Client accounts only */}
              {!isSchool && onFullNameChange && onEmailChange && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tên hiển thị</Label>
                    <Input
                      type="text"
                      value={fullName || ''}
                      onChange={(e) => onFullNameChange(e.target.value)}
                      placeholder="Họ và tên của bạn"
                      className="h-12 bg-secondary/50 border-border/50 rounded-xl px-4 text-foreground placeholder:text-muted-foreground/50 focus:bg-background transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</Label>
                    <Input
                      type="email"
                      value={email || ''}
                      onChange={(e) => onEmailChange(e.target.value)}
                      placeholder="Email của bạn (Bắt buộc)"
                      className="h-12 bg-secondary/50 border-border/50 rounded-xl px-4 text-foreground placeholder:text-muted-foreground/50 focus:bg-background transition-colors"
                    />
                  </div>
                </div>
              )}

              {isSchool && onSchoolNameChange && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tên trường học / Tổ chức</Label>
                    <Input
                      type="text"
                      value={schoolName || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^a-zA-Z0-9À-ỹ\s]/g, '');
                        onSchoolNameChange(val);
                      }}
                      placeholder="VD: Trường Đại học Bách Khoa"
                      className="h-12 bg-secondary/50 border-border/50 rounded-xl px-4 text-foreground placeholder:text-muted-foreground/50 focus:bg-background transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Mã số thuế / Mã Cơ Sở GD</Label>
                    <Input
                      type="text"
                      value={taxId || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                        onTaxIdChange && onTaxIdChange(val);
                      }}
                      placeholder="VD: 0100684128"
                      className="h-12 bg-secondary/50 border-border/50 rounded-xl px-4 text-foreground placeholder:text-muted-foreground/50 focus:bg-background transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Người đại diện pháp luật</Label>
                    <Input
                      type="text"
                      value={representative || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^a-zA-ZÀ-ỹ\s]/g, '');
                        onRepresentativeChange && onRepresentativeChange(val);
                      }}
                      placeholder="Họ và tên"
                      className="h-12 bg-secondary/50 border-border/50 rounded-xl px-4 text-foreground placeholder:text-muted-foreground/50 focus:bg-background transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email liên hệ</Label>
                      <Input
                        type="email"
                        value={email || ''}
                        onChange={(e) => onEmailChange && onEmailChange(e.target.value)}
                        placeholder="... @edu.vn"
                        className="h-12 bg-secondary/50 border-border/50 rounded-xl px-4 text-foreground placeholder:text-muted-foreground/50 focus:bg-background transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Số điện thoại</Label>
                      <Input
                        type="tel"
                        value={phone || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          onPhoneChange && onPhoneChange(val);
                        }}
                        placeholder="0912..."
                        className="h-12 bg-secondary/50 border-border/50 rounded-xl px-4 text-foreground placeholder:text-muted-foreground/50 focus:bg-background transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    placeholder="Tối thiểu 8 ký tự"
                    className="h-12 bg-secondary/50 border-border/50 rounded-xl px-4 pr-12 text-foreground placeholder:text-muted-foreground/50 focus:bg-background transition-colors"
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
                  className="h-12 bg-secondary/50 border-border/50 rounded-xl px-4 text-foreground placeholder:text-muted-foreground/50 focus:bg-background transition-colors"
                />
              </div>

              <TrongDongDivider />

              <Button
                onClick={onCreateWallet}
                disabled={
                  isLoading || 
                  !password || 
                  password.length < 8 || 
                  password !== confirmPassword ||
                  (isSchool && (!schoolName || !taxId || !representative || !email || !phone)) ||
                  (!isSchool && (!fullName || !email))
                }
                className="w-full h-12 rounded-xl font-display font-semibold text-sm"
              >
                {isLoading ? 'Đang tạo...' : 'Tiếp tục'}
                <ShieldCheck size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
  );
};

export default CreateWallet;
