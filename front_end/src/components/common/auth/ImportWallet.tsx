import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowRight, Eye, EyeOff, ShieldCheck, User } from 'lucide-react';

interface ImportWalletProps {
  error: string;
  isLoading: boolean;
  showPassword: boolean;
  password: string;
  currentAddress?: string | null;
  onPasswordChange: (password: string) => void;
  onTogglePassword: () => void;
  onLogin: () => void;
  onBack: () => void;
  onClearWallet: () => void;
}

const ImportWallet = ({
  error,
  isLoading,
  showPassword,
  password,
  currentAddress,
  onPasswordChange,
  onTogglePassword,
  onLogin,
  onBack,
  onClearWallet,
}: ImportWalletProps) => {
  return (
    <div className="relative z-10 w-full max-w-md mx-4">
      <div className="glass-card rounded-2xl p-10 shadow-[0_8px_40px_-12px_hsla(0,0%,0%,0.08)]">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mb-6">
              <ShieldCheck className="w-10 h-10 text-primary-foreground" />
            </div>

            <h2 className="font-display text-xl font-bold text-foreground mb-1">Chào mừng trở lại</h2>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Nhập mật khẩu để đăng nhập vào tài khoản
            </p>

            {currentAddress && (
              <div className="mb-6 p-4 bg-primary/5 rounded-2xl w-full border border-primary/10 flex flex-col items-center">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-bold text-foreground mb-1">
                  {localStorage.getItem('full_name') || 'Tài khoản của tôi'}
                </p>
                <code className="text-[10px] text-muted-foreground font-mono bg-secondary/30 px-2 py-0.5 rounded break-all text-center">
                  ID: {currentAddress.slice(0, 12)}...{currentAddress.slice(-12)}
                </code>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg w-full">
                <p className="text-sm text-destructive text-center">{error}</p>
              </div>
            )}

            <div className="space-y-4 w-full">
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Mật khẩu truy cập</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    placeholder="Nhập mật khẩu của bạn"
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

              <Button
                onClick={onLogin}
                disabled={isLoading || !password || password.length < 8 || !currentAddress}
                className="w-full h-12 rounded-xl font-display font-semibold text-sm"
              >
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập ngay'}
                <ArrowRight size={16} className="ml-2" />
              </Button>
              {!currentAddress && (
                <p className="text-[10px] text-destructive text-center mt-2 px-2">
                  Dữ liệu ví đã bị xóa hoặc không tìm thấy. Vui lòng quay lại để tạo/nhập ví mới.
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-col items-center gap-3">
              <button 
                onClick={onClearWallet} 
                className="text-sm text-primary font-semibold hover:text-primary/80 transition-colors flex items-center gap-2"
                title="Chuyển đổi giữa các tài khoản đã lưu"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Chuyển tài khoản
              </button>
              
              <button 
                onClick={onBack} 
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Quay lại
              </button>
            </div>
          </div>
        </div>
      </div>
  );
};

export default ImportWallet;
