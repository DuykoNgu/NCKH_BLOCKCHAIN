import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface ImportMnemonicProps {
  error: string;
  isLoading: boolean;
  onImport: (mnemonic: string, password: string) => void;
  onBack: () => void;
}

const ImportMnemonic = ({ error, isLoading, onImport, onBack }: ImportMnemonicProps) => {
  const [mnemonic, setMnemonic] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return; // Should be handled by parent or local error
    }
    onImport(mnemonic.trim().toLowerCase(), password);
  };

  const isFormValid = mnemonic.split(/\s+/).length >= 12 && password.length >= 8 && password === confirmPassword;

  return (
    <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300">
      <button onClick={onBack} className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft size={16} className="mr-1" /> Quay lại
      </button>

      <h2 className="font-display text-xl font-bold text-foreground mb-1">Khôi phục tài khoản</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Nhập 12 từ khóa bí mật (Mnemonic) để khôi phục quyền truy cập vào hồ sơ của bạn.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">ID 12 từ khóa (Thay thế Email/Username)</Label>
          <textarea
            value={mnemonic}
            onChange={(e) => setMnemonic(e.target.value)}
            placeholder="Ví dụ: apple banana cherry ..."
            className="w-full min-h-[100px] bg-secondary/50 border border-border/50 rounded-xl p-4 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:bg-background focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
          />
          <p className="text-[10px] text-muted-foreground leading-relaxed italic">
            * Cụm từ này được cấp khi bạn đăng ký tài khoản. Hệ thống Blockchain không sử dụng Email để đăng nhập để đảm bảo tính riêng tư.
          </p>
        </div>

        <div className="space-y-2 pt-2 border-t border-border/30">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Mật khẩu cho thiết bị này</Label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Thiết lập mật khẩu mở khóa"
              className="h-12 bg-secondary/50 border-border/50 rounded-xl px-4 pr-12 text-foreground placeholder:text-muted-foreground/50 focus:bg-background transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Dùng để mở khóa nhanh khi bạn quay lại bằng trình duyệt này.
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Xác nhận mật khẩu</Label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu trên"
            className="h-12 bg-secondary/50 border-border/50 rounded-xl px-4 text-foreground placeholder:text-muted-foreground/50 focus:bg-background transition-colors"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading || !isFormValid}
          className="w-full h-12 rounded-xl font-display font-semibold text-sm mt-4"
        >
          {isLoading ? 'Đang xác thực...' : 'Khôi phục & Đặt mật khẩu'}
          <ShieldCheck size={16} className="ml-2" />
        </Button>
      </form>
    </div>
  );
};

export default ImportMnemonic;
