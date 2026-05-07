import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowRight, Eye, EyeOff, ShieldCheck, User, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  onGoToImportMnemonic: () => void;
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
  onGoToImportMnemonic,
}: ImportWalletProps) => {
  return (
    <div className="glass-card rounded-2xl p-10 shadow-[0_8px_40px_-12px_hsla(0,0%,0%,0.08)]">
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mb-6">
          <ShieldCheck className="w-10 h-10 text-primary-foreground" />
        </div>

        <h2 className="font-display text-xl font-bold text-foreground mb-1 text-center">Chào mừng trở lại</h2>
        <p className="text-sm text-muted-foreground mb-4 text-center">
          Nhập mật khẩu để mở khóa tài khoản
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

        <div className="space-y-4 w-full">
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Mật khẩu mở khóa</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder="Nhập mật khẩu"
                className={cn(
                  "h-12 bg-secondary/50 border-border/50 rounded-xl px-4 pr-12 text-foreground placeholder:text-muted-foreground/50 focus:bg-background transition-colors",
                  error && "border-destructive/50 bg-destructive/5 ring-destructive/20 focus-visible:ring-destructive"
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
            {error && <p className="text-[11px] text-destructive font-medium ml-1 animate-in fade-in slide-in-from-top-1 duration-200">{error}</p>}
          </div>

          <Button
            onClick={onLogin}
            disabled={isLoading || !password || password.length < 8 || !currentAddress}
            className="w-full h-12 rounded-xl font-display font-semibold text-sm shadow-lg shadow-primary/20"
          >
            {isLoading ? 'Đang mở khóa...' : 'Mở khóa ví'}
            <ArrowRight size={16} className="ml-2" />
          </Button>
          {!currentAddress && (
            <p className="text-[10px] text-destructive text-center mt-2 px-2">
              Dữ liệu ví đã bị xóa hoặc không tìm thấy. Vui lòng quay lại để tạo/nhập ví mới.
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          {!currentAddress ? (
            <button
              onClick={onGoToImportMnemonic}
              className="text-sm text-primary font-semibold hover:underline flex items-center gap-1"
            >
              <KeyRound size={14} /> Khôi phục bằng Seed Phrase
            </button>
          ) : (
            <button
              onClick={onClearWallet}
              className="text-sm text-primary font-medium hover:underline transition-colors"
              title="Xóa ví cũ khỏi trình duyệt"
            >
              Dùng tài khoản khác
            </button>
          )}

          <button
            onClick={onBack}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Quay lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportWallet;
