import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createWallet, registerSchool, importWallet } from '@/services/authService';
import { useWallet } from '@/hooks/useWallet';

export const useLoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');
  const { unlock } = useWallet();
  
  const [step, setStep] = useState<'home' | 'import' | 'set-password' | 'school-register' | 'import-mnemonic'>('home');
  const [showSeed, setShowSeed] = useState(false);
  
  const [seed, setSeed] = useState<string[]>([]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [schoolName, setSchoolName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [representative, setRepresentative] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (type === 'import') {
      const hasWallet = !!localStorage.getItem('address');
      if (!hasWallet) {
        setStep('import-mnemonic');
      } else {
        setStep('import');
      }
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
    setError('');
  }, [type]);

  const handleLogin = async () => {
    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await unlock(password);
      const role = localStorage.getItem('role');
      if (role === 'admin' || role === 'moet') {
        navigate('/admin');
      } else {
        navigate('/home');
      }
    } catch (err) {
      setError('Đăng nhập thất bại. Vui lòng kiểm tra lại mật khẩu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWallet = async () => {
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (password.length < 8) {
      setError('Mật khẩu phải từ 8 ký tự trở lên');
      return;
    }
    
    setIsLoading(true);
    setError('');
    try {
      const result = await createWallet(password);
      setSeed(result.mnemonic.split(' '));
      setShowSeed(true);
    } catch (err: any) {
      setError(err.message || 'Không thể tạo ví');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportMnemonic = async (mnemonic: string) => {
    setIsLoading(true);
    setError('');
    try {
      await importWallet(mnemonic, password);
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
    // Logic tương tự create wallet nhưng có thêm info trường
    setIsLoading(true);
    try {
      await registerSchool(password, schoolName);
      const role = localStorage.getItem('role');
      if (role === 'admin' || role === 'moet') {
        navigate('/admin');
      } else {
        navigate('/home');
      }
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
    confirmPassword,
    setConfirmPassword,
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
    handleLogin,
    handleCreateWallet,
    handleImportMnemonic,
    handleSchoolRegister,
    navigate
  };
};
