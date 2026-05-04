import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LoginHome from '@/components/common/auth/LoginHome';
import ImportWallet from '@/components/common/auth/ImportWallet';
import CreateWallet from '@/components/common/auth/CreateWallet';
import SeedDisplay from '@/components/common/auth/SeedDisplay';
import { createWallet } from '@/services/authService';
import { useWallet } from '@/hooks/useWallet';
const Scene3D = lazy(() => import('@/components/common/Scene3D'));

const LoginPage = () => {
  const navigate = useNavigate();
  const { type } = useParams<{ type?: string }>();
  
  // Use state to properly trigger re-render when URL changes
  const [step, setStep] = useState<'home' | 'import' | 'set-password'>('home');
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
      setStep('set-password');
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

  const handleCreateWallet = async () => {
    if (!password || password.length < 8 || password !== confirmPassword) {
      setError('Mật khẩu không hợp lệ');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
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

  const handleSeedConfirmed = () => {
    navigate('/login/existing');
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
      
      // Kiểm tra role sau khi đăng nhập để điều hướng đúng trang
      const role = localStorage.getItem("role");
      if (role === 'admin' || role === 'moet') {
        navigate('/admin');
      } else {
        navigate('/home');
      }
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

    // Render seed display
    if (showSeed) {
      return (
        <div className="relative z-10 w-full max-w-md mx-4">
          <div className="glass-card rounded-2xl p-10 shadow-[0_8px_40px_-12px_hsla(0,0%,0%,0.08)]">
            <SeedDisplay 
              seed={seed}
              onBack={() => setShowSeed(false)}
              onConfirmed={handleSeedConfirmed}
            />
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
