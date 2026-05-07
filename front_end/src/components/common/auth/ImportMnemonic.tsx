import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImportMnemonicProps {
  onImport: (mnemonic: string, password: string) => void;
  onBack: () => void;
  isLoading: boolean;
  error: string;
}

const ImportMnemonic = ({ onImport, onBack, isLoading, error }: ImportMnemonicProps) => {
  const [mnemonic, setMnemonic] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return;
    onImport(mnemonic.trim(), password);
  };

  return (
    <div className="glass-card rounded-2xl p-10 shadow-[0_8px_40px_-12px_hsla(0,0%,0%,0.08)]">
      <div className="flex flex-col">
        <button onClick={onBack} className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 self-start">
          <ArrowLeft size={16} className="mr-1" /> Quay lại
        </button>

        <h2 className="font-display text-xl font-bold text-foreground mb-1">Khôi phục ví</h2>
        <p className="text-sm text-muted-foreground mb-6"> Nhập 12 từ khóa bí mật để khôi phục tài khoản của bạn. </p>


        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Seed Phrase (12 từ)</Label>
            <textarea
              value={mnemonic}
              onChange={(e) => setMnemonic(e.target.value)}
              placeholder="VD: word1 word2 word3 ..."
              className={cn(
                "w-full min-h-[100px] rounded-xl bg-secondary/50 border-border/50 px-4 py-3 text-sm font-mono focus:bg-background transition-colors outline-none focus:ring-1 focus:ring-primary/30",
                error && (error.includes('Seed') || error.includes('từ') || error.includes('khóa')) && "border-destructive/50 bg-destructive/5 ring-destructive/20 focus:ring-destructive/30"
              )}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Mật khẩu mới</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu bảo vệ ví"
                className={cn(
                  "h-12 bg-secondary/50 border-border/50 rounded-xl px-4 pr-12",
                  error && (error.includes('Mật khẩu') || error.includes('khớp')) && "border-destructive/50 bg-destructive/5 ring-destructive/20 focus-visible:ring-destructive"
                )}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
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
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              className={cn(
                "h-12 bg-secondary/50 border-border/50 rounded-xl px-4",
                error && error.includes('khớp') && "border-destructive/50 bg-destructive/5 ring-destructive/20 focus-visible:ring-destructive"
              )}
              required
            />
          </div>
          {error && <p className="text-[11px] text-destructive font-medium ml-1 animate-in fade-in slide-in-from-top-1 duration-200">{error}</p>}

          <Button
            type="submit"
            disabled={isLoading || !mnemonic || password.length < 8 || password !== confirmPassword}
            className="w-full h-12 rounded-xl font-display font-semibold text-sm mt-4"
          >
            {isLoading ? 'Đang khôi phục...' : 'Khôi phục tài khoản'}
            <ShieldCheck size={16} className="ml-2" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ImportMnemonic;
