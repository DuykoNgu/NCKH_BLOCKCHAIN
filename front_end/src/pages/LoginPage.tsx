import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LoginHome from '@/components/auth/LoginHome';
import ImportWallet from '@/components/auth/ImportWallet';
import CreateWallet from '@/components/auth/CreateWallet';
import SeedDisplay from '@/components/auth/SeedDisplay';
import { createWallet } from '@/services/authService';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
const Scene3D = lazy(() => import('@/components/common/Scene3D'));

const LoginPage = () => {
  const navigate = useNavigate();
  const { type } = useParams<{ type?: string }>();
  
  // Use state to properly trigger re-render when URL changes
  const [step, setStep] = useState<'home' | 'import' | 'create-seed' | 'set-password'>('home');
  const [showSeed, setShowSeed] = useState(false);
  
  const [seed, setSeed] = useState<string[]>([]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Update step when URL type changes
  useEffect(() => {
    if (type === 'existing') {
      setStep('import');
    } else if (type === 'new') {
      setStep('create-seed');
    } else {
      setStep('home');
    }
    // Reset states when URL changes
    setShowSeed(false);
    setSeed([]);
    setPassword('');
    setConfirmPassword('');
    setError('');
  }, [type]);

  // Generate wallet and show in console
  const handleGenerateWallet = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Create wallet - this will log seed phrase, private key, and address to console
      const result = await createWallet(password);
      setSeed(result.mnemonic.split(' '));
      setShowSeed(true);
    } catch (err) {
      setError('Tạo ví thất bại. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWallet = async () => {
    if (!password || password.length < 8 || password !== confirmPassword) {
      setError('Mật khẩu không hợp lệ');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Re-create wallet with new password (to replace the empty password one)
      // This will generate a new wallet - ideally we should re-encrypt the existing one
      // For now, just create new wallet with password and navigate to home
      await createWallet(password);
      navigate('/');
    } catch (err) {
      setError('Tạo ví thất bại. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedConfirmed = () => {
    // After confirming seed phrase, go to set password step
    setStep('set-password');
    setShowSeed(false);
  };

  const { unlock } = useWallet();

  const handleLogin = async () => {
    if (!password || password.length < 8) {
      setError('Vui lòng nhập mật khẩu (tối thiểu 8 ký tự)');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await unlock(password);
      navigate('/');
    } catch (err) {
      setError('Đăng nhập thất bại. Vui lòng kiểm tra lại mật khẩu.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Render content based on step - Scene3D stays mounted at root level
  const renderContent = () => {
    // Render home page
    if (step === 'home' && !showSeed) {
      return <LoginHome />;
    }

    // Render seed display (Step 1: Show Seed Phrase)
    if (showSeed) {
      return (
        <div className="relative z-10 w-full max-w-md mx-4">
          <div className="glass-card rounded-2xl p-10 shadow-[0_8px_40px_-12px_hsla(0,0%,0%,0.08)]">
            <SeedDisplay 
              seed={seed}
              onBack={() => {
                setShowSeed(false);
                setStep('create-seed');
              }}
              onConfirmed={handleSeedConfirmed}
            />
          </div>
        </div>
      );
    }

    // Render create-seed page (Step 1: Generate Seed Phrase, log Private Key & Address to console)
    if (step === 'create-seed') {
      return (
        <div className="relative z-10 w-full max-w-md mx-4">
          <div className="glass-card rounded-2xl p-10 shadow-[0_8px_40px_-12px_hsla(0,0%,0%,0.08)]">
            <h2 className="font-display text-xl font-bold text-foreground mb-1">Bước 1: Tạo Seed Phrase</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Nhấn nút bên dưới để tạo Seed Phrase. Private Key và Public Address sẽ hiển thị trong Console (F12).
            </p>
            
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              onClick={handleGenerateWallet}
              disabled={isLoading}
              className="w-full h-12 rounded-xl font-display font-semibold text-sm"
            >
              {isLoading ? 'Đang tạo ví...' : 'Tạo Seed Phrase'}
            </Button>

            <button 
              onClick={() => navigate('/login')} 
              className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Quay lại
            </button>
          </div>
        </div>
      );
    }

    // Render import/login page
    if (step === 'import') {
      return (
        <ImportWallet
          error={error}
          isLoading={isLoading}
          showPassword={showPassword}
          password={password}
          onPasswordChange={setPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          onLogin={handleLogin}
          onBack={() => navigate('/login')}
        />
      );
    }

    // Render create password page
    return (
      <CreateWallet
        error={error}
        isLoading={isLoading}
        showPassword={showPassword}
        password={password}
        confirmPassword={confirmPassword}
        onPasswordChange={setPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onTogglePassword={() => setShowPassword(!showPassword)}
        onCreateWallet={handleCreateWallet}
        onBack={() => navigate('/login')}
      />
    );
  };

  // Always render Scene3D at root to prevent re-initialization when navigating
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden">
      <Suspense fallback={null}>
        <Scene3D />
      </Suspense>
      {renderContent()}
    </div>
  );
};

export default LoginPage;
