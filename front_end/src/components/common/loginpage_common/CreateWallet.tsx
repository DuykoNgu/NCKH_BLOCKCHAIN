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
  onBack,
}: CreateWalletProps) => {
  return (
    <div className="relative z-10 w-full max-w-md mx-4">
      <div className="glass-card rounded-2xl p-10 shadow-[0_8px_40px_-12px_hsla(0,0%,0%,0.08)]">
          <div className="flex flex-col">
            <button onClick={onBack} className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 self-start">
              <ArrowLeft size={16} className="mr-1" /> Quay lại
            </button>

            <h2 className="font-display text-xl font-bold text-foreground mb-1">Tạo mật khẩu</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Mật khẩu dùng để mở khóa ví trên thiết bị này.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="space-y-4">
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
                disabled={isLoading || !password || password.length < 8 || password !== confirmPassword}
                className="w-full h-12 rounded-xl font-display font-semibold text-sm"
              >
                {isLoading ? 'Đang tạo ví...' : 'Tiếp tục'}
                <ShieldCheck size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
  );
};

export default CreateWallet;
