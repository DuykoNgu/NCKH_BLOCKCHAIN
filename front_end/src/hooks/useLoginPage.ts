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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [schoolName, setSchoolName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [representative, setRepresentative] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');

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
    setPassword('');
    setConfirmPassword('');
    setSchoolName('');
    setTaxId('');
    setRepresentative('');
    setEmail('');
    setPhone('');
    setFullName('');
    setError('');
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

  const handleCreateWallet = async () => {
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (password.length < 8) {
      setError('Mật khẩu phải từ 8 ký tự trở lên');
      return;
    }
    if (!fullName.trim() || !email.trim()) {
      setError('Vui lòng điền đầy đủ Tên hiển thị và Email');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const result = await createWallet(password, email.trim());
      // Save fullName to localStorage (authService handles basic save, but we might want to ensure fullName is set)
      localStorage.setItem('full_name', fullName.trim());
      
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

  const handleImportMnemonic = async (mnemonic: string, pass: string) => {
    setIsLoading(true);
    setError('');
    try {
      await importWallet(mnemonic, pass);
      const role = localStorage.getItem('role');
      if (role === 'admin' || role === 'moet') {
        navigate('/admin');
      } else {
        navigate('/home');
      }
    } catch (err: any) {
      setError(err.message || 'Khôi phục ví thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchoolRegister = async () => {
    if (!schoolName || !taxId || !representative || !email || !phone) {
      setError('Vui lòng điền đầy đủ các thông tin pháp lý');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const result = await registerSchool(password, schoolName, taxId, representative, email, phone);
      setSeed(result.mnemonic.split(' '));
      setShowSeed(true);
    } catch (err: any) {
      setError(err.message || 'Đăng ký trường thất bại');
    } finally {
      setIsLoading(false);
    }
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
    isLoading,
    error,
    schoolName,
    setSchoolName,
    taxId,
    setTaxId,
    representative,
    setRepresentative,
    email,
    setEmail,
    phone,
    setPhone,
    fullName,
    setFullName,
    handleLogin,
    handleCreateWallet,
    handleImportMnemonic,
    handleSchoolRegister,
    navigate
  };
};
