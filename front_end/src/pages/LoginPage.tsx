import { lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clearOldSession } from '@/services/authService';
import { useLoginPage } from '@/hooks/useLoginPage';
import LoginHome from '@/components/common/auth/LoginHome';
import ImportWallet from '@/components/common/auth/ImportWallet';
import ImportMnemonic from '@/components/common/auth/ImportMnemonic';
import CreateWallet from '@/components/common/auth/CreateWallet';
import SeedDisplay from '@/components/common/auth/SeedDisplay';
import BlockchainCommitmentModal from '@/components/common/auth/BlockchainCommitmentModal';
import { cn } from '@/lib/utils';

const Scene3D = lazy(() => import('@/components/common/Scene3D'));

const LoginPage = () => {
  const {
    step,
    setStep,
    showSeed,
    seed,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    isLoading,
    error,
    schoolName,
    setSchoolName,
    taxId,
    setTaxId,
    representative,
    email,
    setEmail,
    phone,
    setPhone,
    fullName,
    setFullName,
    selectedFile,
    setSelectedFile,
    showCommitmentModal,
    commitmentConfirmed,
    handleLogin,
    handleCreateWallet,
    handleImportMnemonic,
    handleSchoolRegister,
    handleCommitmentConfirm,
    navigate
  } = useLoginPage();

  const renderContent = () => {
    // Render home page
    if (step === 'home' && !showSeed) {
      return <LoginHome />;
    }

    // Render seed phrase display (after creation)
    if (showSeed) {
      return (
        <SeedDisplay
          seed={seed}
          onBack={() => navigate('/login')}
          onConfirmed={() => navigate('/home')}
        />
      );
    }

    // Render import existing wallet
    if (step === 'import') {
      const handleClearWallet = () => {
        if (window.confirm("CẢNH BÁO: Bạn chuẩn bị xóa dữ liệu đăng nhập khỏi thiết bị này. Lần sau muốn đăng nhập lại, bạn sẽ BẮT BUỘC phải dùng 12 từ khóa bí mật để khôi phục. Bạn có chắc chắn muốn xóa?")) {
          clearOldSession();
          window.location.href = '/login';
        }
      };

      const currentAddress = localStorage.getItem('address');

      return (
        <ImportWallet
          password={password}
          showPassword={showPassword}
          onPasswordChange={setPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          onLogin={handleLogin}
          onBack={() => navigate('/login')}
          onClearWallet={handleClearWallet}
          isLoading={isLoading}
          error={error}
          currentAddress={currentAddress}
          onGoToImportMnemonic={() => setStep('import-mnemonic')}
        />
      );
    }

    // Render import mnemonic
    if (step === 'import-mnemonic') {
      return (
        <ImportMnemonic
          onImport={handleImportMnemonic}
          onBack={() => navigate('/login')}
          isLoading={isLoading}
          error={error}
        />
      );
    }

    // Render create new wallet (set password)
    if (step === 'set-password' || step === 'school-register') {
      const isSchool = step === 'school-register';
      
      // If it's school registration and commitment not confirmed, don't render form yet
      if (isSchool && !commitmentConfirmed) {
        return null;
      }

      return (
        <CreateWallet
          onSubmit={isSchool ? handleSchoolRegister : handleCreateWallet}
          onBack={() => navigate('/login')}
          isLoading={isLoading}
          isSchool={isSchool}
          fullName={fullName}
          onFullNameChange={setFullName}
          email={email}
          onEmailChange={setEmail}
          schoolName={schoolName}
          onSchoolNameChange={setSchoolName}
          taxId={taxId}
          onTaxIdChange={setTaxId}
          representative={representative}
          phone={phone}
          onPhoneChange={setPhone}
          selectedFile={selectedFile}
          onSelectedFileChange={setSelectedFile}
        />
      );
    }

    return null;
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden">
      <Suspense fallback={null}>
        <Scene3D />
      </Suspense>

      <AnimatePresence>
        {showCommitmentModal && (
          <BlockchainCommitmentModal
            onConfirm={handleCommitmentConfirm}
            isLoading={isLoading}
          />
        )}
      </AnimatePresence>

      <div className={cn("relative z-10 w-full mx-4 transition-all duration-500", step === 'school-register' ? "max-w-2xl" : "max-w-md")}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step + (showSeed ? '-seed' : '')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fixed bottom-6 text-center w-full text-xs text-muted-foreground/60 font-medium tracking-widest uppercase">
        EduChain Network • Security Layer v1.0
      </div>
    </div>
  );
};

export default LoginPage;
