import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface ImportWalletProps {
  error: string;
  isLoading: boolean;
  showPassword: boolean;
  password: string;
  onPasswordChange: (password: string) => void;
  onTogglePassword: () => void;
  onLogin: () => void;
  onBack: () => void;
}

const ImportWallet = ({
  error,
  isLoading,
  showPassword,
  password,
  onPasswordChange,
  onTogglePassword,
  onLogin,
  onBack,
}: ImportWalletProps) => {
  return (
    <div className="relative z-10 w-full max-w-md mx-4">
      <div className="glass-card rounded-2xl p-10 shadow-[0_8px_40px_-12px_hsla(0,0%,0%,0.08)]">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mb-6">
              <ShieldCheck className="w-10 h-10 text-primary-foreground" />
            </div>

            <h2 className="font-display text-xl font-bold text-foreground mb-1">Chào mừng trở lại</h2>
            <p className="text-sm text-muted-foreground mb-6 text-center">
              Nhập mật khẩu để truy cập tài khoản của bạn
            </p>

            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg w-full">
                <p className="text-sm text-destructive text-center">{error}</p>
              </div>
            )}

            <div className="space-y-4 w-full">
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    placeholder="Nhập mật khẩu"
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
                disabled={isLoading || !password || password.length < 8}
                className="w-full h-12 rounded-xl font-display font-semibold text-sm"
              >
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>

            <button 
              onClick={onBack} 
              className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Tạo tài khoản mới
            </button>
          </div>
        </div>
      </div>
  );
};

export default ImportWallet;
