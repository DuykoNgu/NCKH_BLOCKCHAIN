import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { createWallet, registerSchool, importWallet } from '@/services/authService';
import { useWallet } from '@/hooks/useWallet';
import { toast } from 'sonner';
import { STORAGE_KEYS } from '@/constants/storage';

export const useLoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');
  const { unlock } = useWallet();
  
  const [step, setStep] = useState<'home' | 'import' | 'set-password' | 'school-register' | 'import-mnemonic'>('home');
  const [showSeed, setShowSeed] = useState(false);
  const [seed, setSeed] = useState<string[]>([]);
  
  // Form states
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    if (type === 'import') {
      const hasWallet = !!localStorage.getItem(STORAGE_KEYS.ADDRESS);
      setStep(hasWallet ? 'import' : 'import-mnemonic');
    } else if (type === 'create') {
      setStep('set-password');
    } else if (type === 'school') {
      setStep('school-register');
    } else {
      setStep('home');
    }
    
    // Reset states
    setShowSeed(false);
    setSeed([]);
    setPassword(''); // We still need this for the 'import' step if not refactored yet
  }, [type]);

  const loginMutation = useMutation({
    mutationFn: (pwd: string) => unlock(pwd),
    onSuccess: () => {
      const role = localStorage.getItem(STORAGE_KEYS.ROLE);
      navigate(role === 'admin' || role === 'moet' ? '/admin' : '/home');
      toast.success('Đăng nhập thành công');
    },
    onError: () => toast.error('Đăng nhập thất bại. Vui lòng kiểm tra lại mật khẩu.')
  });

  const createWalletMutation = useMutation({
    mutationFn: (pwd: string) => createWallet(pwd),
    onSuccess: (result) => {
      setSeed(result.mnemonic.split(' '));
      setShowSeed(true);
      toast.success('Tạo ví thành công');
    },
    onError: (err: any) => toast.error(err.message || 'Không thể tạo ví')
  });

  const importMnemonicMutation = useMutation({
    mutationFn: ({ mnemonic, pwd }: { mnemonic: string; pwd: string }) => importWallet(mnemonic, pwd),
    onSuccess: () => {
      const role = localStorage.getItem(STORAGE_KEYS.ROLE);
      navigate(role === 'admin' || role === 'moet' ? '/admin' : '/home');
      toast.success('Khôi phục ví thành công');
    },
    onError: (err: any) => toast.error(err.message || 'Khôi phục ví thất bại')
  });

  const schoolRegisterMutation = useMutation({
    mutationFn: ({ pwd, name }: { pwd: string; name: string }) => registerSchool(pwd, name),
    onSuccess: () => {
      const role = localStorage.getItem(STORAGE_KEYS.ROLE);
      navigate(role === 'admin' || role === 'moet' ? '/admin' : '/home');
      toast.success('Đăng ký trường thành công');
    },
    onError: (err: any) => toast.error(err.message || 'Đăng ký trường thất bại')
  });

  const handleLogin = () => {
    if (!password) return toast.error('Vui lòng nhập mật khẩu');
    loginMutation.mutate(password);
  };

  const handleCreateWallet = (values: any) => {
    createWalletMutation.mutate(values.password);
  };

  const handleImportMnemonic = (mnemonic: string) => {
    importMnemonicMutation.mutate({ mnemonic, pwd: password });
  };

  const handleSchoolRegister = (values: any) => {
    schoolRegisterMutation.mutate({ pwd: values.password, name: values.schoolName });
  };

  return {
    step,
    setStep,
    showSeed,
    setShowSeed,
    seed,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    isLoading: loginMutation.isPending || createWalletMutation.isPending || importMnemonicMutation.isPending || schoolRegisterMutation.isPending,
    error: (loginMutation.error as any)?.message || (createWalletMutation.error as any)?.message || (importMnemonicMutation.error as any)?.message || (schoolRegisterMutation.error as any)?.message || '',
    handleLogin,
    handleCreateWallet,
    handleImportMnemonic,
    handleSchoolRegister,
    navigate
  };
};
