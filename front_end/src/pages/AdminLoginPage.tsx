import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, KeyRound, ArrowRight, Loader2, Lock, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminImportAndSaveVault, adminUnlockVault, adminClearVault } from '@/services/authService';

type AdminLoginMode = 'unlock' | 'import';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AdminLoginMode>('unlock');
  const [privateKey, setPrivateKey] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Tự động chọn mode dựa vào vault có sẵn chưa
  useEffect(() => {
    const hasAdminVault = !!localStorage.getItem('admin_vault');
    setMode(hasAdminVault ? 'unlock' : 'import');
  }, []);

  const adminAddress = localStorage.getItem('admin_address');

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) { setError('Vui lòng nhập mật khẩu'); return; }
    setIsLoading(true);
    setError('');
    try {
      await adminUnlockVault(password);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Mật khẩu không đúng. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privateKey) { setError('Vui lòng nhập Private Key'); return; }
    if (password.length < 8) { setError('Mật khẩu cần tối thiểu 8 ký tự'); return; }
    if (password !== confirmPassword) { setError('Mật khẩu nhập lại không khớp'); return; }
    setIsLoading(true);
    setError('');
    try {
      await adminImportAndSaveVault(privateKey, password);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Private Key không hợp lệ hoặc không có quyền.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAndReset = () => {
    adminClearVault();
    setMode('import');
    setPassword('');
    setPrivateKey('');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="glass-card rounded-2xl p-10 shadow-[0_8px_40px_-12px_hsla(0,0%,0%,0.08)]">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg mb-6">
              {mode === 'unlock' ? (
                <Lock className="w-8 h-8 text-primary-foreground" />
              ) : (
                <ShieldCheck className="w-8 h-8 text-primary-foreground" />
              )}
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground text-center">
              {mode === 'unlock' ? 'Mở khoá Quản trị' : 'Nhập tài khoản Admin'}
            </h1>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              {mode === 'unlock'
                ? 'Nhập mật khẩu để vào Hệ thống quản trị MOET'
                : 'Lần đầu: nhập Private Key & đặt mật khẩu cục bộ'}
            </p>
            {mode === 'unlock' && adminAddress && (
              <div className="mt-3 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 w-full text-center">
                <p className="text-[10px] text-muted-foreground mb-0.5">Địa chỉ Admin</p>
                <p className="text-xs font-mono text-primary font-semibold truncate">
                  {adminAddress.slice(0, 14)}...{adminAddress.slice(-10)}
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}

          {/* === MODE: UNLOCK (dùng mật khẩu) === */}
          {mode === 'unlock' && (
            <form onSubmit={handleUnlock} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Mật khẩu truy cập
                </Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu đã thiết lập..."
                    className="h-12 bg-secondary/50 border-border/50 rounded-xl px-4 pr-12 text-foreground placeholder:text-muted-foreground/50 focus:bg-background transition-colors"
                    autoFocus
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
                disabled={isLoading || !password}
                className="w-full h-12 rounded-xl font-display font-semibold transition-all group"
              >
                {isLoading ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang xác thực...</>
                ) : (
                  <><Lock className="w-4 h-4 mr-2" /> Đăng nhập ngay <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>

              <button
                type="button"
                onClick={handleClearAndReset}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                <RotateCcw size={12} />
                Đổi tài khoản / Nhập lại Private Key
              </button>
            </form>
          )}

          {/* === MODE: IMPORT (nhập private key lần đầu) === */}
          {mode === 'import' && (
            <form onSubmit={handleImport} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Admin Private Key (chỉ nhập 1 lần)
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="admin-private-key"
                    type="password"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    placeholder="Nhập Private Key (64 ký tự hex)..."
                    className="pl-10 h-12 bg-secondary/50 border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:bg-background transition-colors font-mono text-sm"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                  * Private Key sẽ được mã hoá và lưu an toàn. Bạn không cần nhập lại lần sau.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-border/30">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Đặt mật khẩu cục bộ
                </Label>
                <div className="relative">
                  <Input
                    id="admin-new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 8 ký tự..."
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

              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Xác nhận mật khẩu
                </Label>
                <Input
                  id="admin-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu trên..."
                  className="h-12 bg-secondary/50 border-border/50 rounded-xl px-4 text-foreground placeholder:text-muted-foreground/50 focus:bg-background transition-colors"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || !privateKey || password.length < 8 || password !== confirmPassword}
                className="w-full h-12 rounded-xl font-display font-semibold transition-all group mt-2"
              >
                {isLoading ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang xác thực & lưu...</>
                ) : (
                  <>Xác nhận & Vào Hệ thống <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              ← Quay lại trang đăng nhập người dùng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
