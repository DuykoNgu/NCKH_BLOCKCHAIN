import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Loader2, Lock, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminUnlockVault, adminClearVault, fetchVault, fetchProfile } from '@/services/authService';
import { decryptPrivateKey } from '@/utils/cryptoVault';
import saveUserData from '@/utils/saveDataToStorage';

type AdminLoginMode = 'unlock' | 'new-device';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AdminLoginMode>('unlock');
  const [adminAddressInput, setAdminAddressInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const savedAdminAddress = localStorage.getItem('admin_address');

  useEffect(() => {
    const hasAdminVault = !!localStorage.getItem('admin_vault');
    setMode(hasAdminVault ? 'unlock' : 'new-device');
  }, []);

  // Đăng nhập trên thiết bị đã có vault cục bộ
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

  // Đăng nhập thiết bị mới: lấy vault từ server → giải mã bằng mật khẩu
  const handleNewDeviceLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminAddressInput.trim()) { setError('Vui lòng nhập địa chỉ ví Admin'); return; }
    if (!password) { setError('Vui lòng nhập mật khẩu'); return; }
    setIsLoading(true);
    setError('');
    try {
      // 1. Lấy vault từ server
      const vaultStr = await fetchVault(adminAddressInput.trim());
      if (!vaultStr) {
        throw new Error('Không tìm thấy tài khoản. Kiểm tra lại tên hoặc địa chỉ ví.');
      }

      const vault = JSON.parse(vaultStr);

      // 2. Giải mã bằng mật khẩu để xác thực
      const privateKey = await decryptPrivateKey(vault, password);
      if (!privateKey) throw new Error('Mật khẩu không chính xác.');

      // 3. Lấy profile và kiểm tra quyền admin
      const profile = await fetchProfile(adminAddressInput.trim());
      const role = profile?.user?.role;
      if (role !== 'moet' && role !== 'admin') {
        throw new Error('Tài khoản này không có quyền quản trị MOET.');
      }

      // 4. Lưu vault local để lần sau chỉ cần mật khẩu
      localStorage.setItem('admin_vault', vaultStr);
      localStorage.setItem('admin_address', adminAddressInput.trim().toLowerCase());
      localStorage.setItem('isLoggedIn', 'true');
      saveUserData({ ...profile.user, is_active: '1' });

      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAndReset = () => {
    adminClearVault();
    setAdminAddressInput('');
    setPassword('');
    setError('');
    setMode('new-device');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="glass-card rounded-2xl p-10 shadow-[0_8px_40px_-12px_hsla(0,0%,0%,0.08)]">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg mb-6">
              {mode === 'unlock'
                ? <Lock className="w-8 h-8 text-primary-foreground" />
                : <ShieldCheck className="w-8 h-8 text-primary-foreground" />
              }
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground text-center">
              {mode === 'unlock' ? 'Mở khoá Quản trị' : 'Đăng nhập Quản trị'}
            </h1>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              {mode === 'unlock'
                ? 'Nhập mật khẩu để vào Hệ thống quản trị MOET'
                : 'Nhập địa chỉ ví và mật khẩu để đăng nhập'}
            </p>
            {mode === 'unlock' && savedAdminAddress && (
              <div className="mt-3 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 w-full text-center">
                <p className="text-[10px] text-muted-foreground mb-0.5">Địa chỉ Admin</p>
                <p className="text-xs font-mono text-primary font-semibold truncate">
                  {savedAdminAddress.slice(0, 14)}...{savedAdminAddress.slice(-10)}
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}

          {/* === MODE: UNLOCK === */}
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
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={isLoading || !password}
                className="w-full h-12 rounded-xl font-display font-semibold transition-all group">
                {isLoading
                  ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang xác thực...</>
                  : <><Lock className="w-4 h-4 mr-2" /> Đăng nhập ngay <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /></>
                }
              </Button>
              <button type="button" onClick={handleClearAndReset}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
                <RotateCcw size={12} /> Đăng nhập trên thiết bị mới
              </button>
            </form>
          )}

          {/* === MODE: NEW DEVICE === */}
          {mode === 'new-device' && (
            <form onSubmit={handleNewDeviceLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Tên hoặc Địa chỉ ví Admin
                </Label>
                <Input
                  id="admin-address"
                  type="text"
                  value={adminAddressInput}
                  onChange={(e) => setAdminAddressInput(e.target.value)}
                  placeholder="Bộ Giáo Dục hoặc 0x..."
                  className="h-12 bg-secondary/50 border-border/50 rounded-xl px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:bg-background transition-colors"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Mật khẩu
                </Label>
                <div className="relative">
                  <Input
                    id="admin-new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className="h-12 bg-secondary/50 border-border/50 rounded-xl px-4 pr-12 text-foreground placeholder:text-muted-foreground/50 focus:bg-background transition-colors"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={isLoading || !adminAddressInput || !password}
                className="w-full h-12 rounded-xl font-display font-semibold transition-all group mt-2">
                {isLoading
                  ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang xác thực...</>
                  : <>Đăng nhập <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" /></>
                }
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button onClick={() => navigate('/login')}
              className="text-sm text-muted-foreground hover:text-primary transition-colors">
              ← Quay lại trang đăng nhập người dùng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
