import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { useValidatorRegister } from '@/hooks/useValidatorRegister';

// Sub-components
import RegisterStep1 from '@/components/common/auth/register-steps/RegisterStep1';
import RegisterStep2 from '@/components/common/auth/register-steps/RegisterStep2';
import RegisterStep3 from '@/components/common/auth/register-steps/RegisterStep3';
import RegisterSuccess from '@/components/common/auth/register-steps/RegisterSuccess';

const StepIndicator = ({ currentStep }: { currentStep: number }) => (
  <div className="flex justify-center gap-2 mb-8">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className={`h-1.5 rounded-full transition-all duration-300 ${
          i === currentStep ? 'w-8 bg-primary' : 'w-2 bg-primary/20'
        }`}
      />
    ))}
  </div>
);

const ValidatorRegisterPage: React.FC = () => {
  const {
    step,
    setStep,
    wallet,
    nodeInfo,
    submitting,
    success,
    error,
    handleWalletCreated,
    handleNodeInfoSubmit,
    handleRegister,
    navigate
  } = useValidatorRegister();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      {/* Background decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={success ? 'success' : step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-border/40 shadow-2xl shadow-primary/5 bg-background/60 backdrop-blur-xl">
              <CardContent className="pt-8 px-8 pb-10">
                {!success && step < 3 && <StepIndicator currentStep={step} />}
                
                {error && (
                  <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm text-center">
                    {error}
                  </div>
                )}

                {success ? (
                  <RegisterSuccess onGoLogin={() => navigate('/login')} />
                ) : (
                  <>
                    {step === 0 && (
                      <RegisterStep1 
                        onCreate={handleWalletCreated} 
                        isLoading={false} 
                      />
                    )}
                    
                    {step === 1 && wallet && (
                      <RegisterStep2
                        wallet={wallet}
                        nodeInfo={nodeInfo}
                        onChange={handleNodeInfoSubmit}
                        onNext={() => setStep(2)}
                        onBack={() => setStep(0)}
                      />
                    )}
                    
                    {step === 2 && wallet && (
                      <RegisterStep3
                        wallet={wallet}
                        nodeInfo={nodeInfo}
                        onBack={() => setStep(1)}
                        onSubmit={handleRegister}
                        submitting={submitting}
                      />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          © 2026 EduChain Network. Hệ thống xác thực văn bằng Blockchain.
        </p>
      </div>
    </div>
  );
};

export default ValidatorRegisterPage;
