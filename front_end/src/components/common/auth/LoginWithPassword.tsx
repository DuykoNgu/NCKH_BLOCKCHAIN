import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck, Mail } from 'lucide-react';

interface LoginWithPasswordProps {
  error: string;
  isLoading: boolean;
  onLogin: (address: string, pass: string) => void;
  onBack: () => void;
  onUseMnemonic: () => void;
}

const LoginWithPassword = ({ error, isLoading, onLogin, onBack, onUseMnemonic }: LoginWithPasswordProps) => {
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address && password) {
      onLogin(address.trim(), password);
    }
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300">
      <button onClick={onBack} className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft size={16} className="mr-1" /> Quay lại
      </button>

      <h2 className="font-display text-xl font-bold text-foreground mb-1">Đăng nhập tài khoản</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Sử dụng địa chỉ ví và mật khẩu để đăng nhập trên thiết bị mới.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Mail size={12} /> Địa chỉ Ví hoặc Tên trường (Validator)
          </Label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x... hoặc tên trường của bạn"
            className="h-12 bg-secondary/50 border-border/50 rounded-xl px-4 text-foreground placeholder:text-muted-foreground/50 focus:bg-background transition-colors"
          />
          <p className="text-xs text-muted-foreground">
            Tài khoản Client: nhập địa chỉ ví <span className="font-mono">0x...</span>
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Mật khẩu</Label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu của bạn"
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
        </div>

        <Button
          type="submit"
          disabled={isLoading || !address || !password}
          className="w-full h-12 rounded-xl font-display font-semibold text-sm mt-4"
        >
          {isLoading ? 'Đang xác thực...' : 'Đăng nhập ngay'}
          <ArrowRight size={16} className="ml-2" />
        </Button>

        <div className="pt-4 text-center">
            <button 
              type="button"
              onClick={onUseMnemonic}
              className="text-xs text-primary hover:underline font-medium"
            >
              Bạn quên mật khẩu hoặc muốn dùng 12 từ khóa?
            </button>
        </div>
      </form>
    </div>
  );
};

export default LoginWithPassword;
