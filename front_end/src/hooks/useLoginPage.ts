import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { createWallet, registerSchool, importWallet } from '@/services/authService';
import { useWallet } from '@/hooks/useWallet';
import { toast } from 'sonner';
import { STORAGE_KEYS } from '@/constants/storage';
import { useAuthContext } from '@/contexts/AuthContext';

export const useLoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');
  const { unlock } = useWallet();
  const { login: contextLogin } = useAuthContext();

  const [step, setStep] = useState<'home' | 'import' | 'set-password' | 'school-register' | 'import-mnemonic'>('home');
  const [showSeed, setShowSeed] = useState(false);
  const [seed, setSeed] = useState<string[]>([]);

  // Form states (kept for legacy support if needed, but updated for form compatibility)
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Individual states for direct props if not using react-hook-form
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

  const handleCreateWallet = async (values?: any) => {
    // If values are provided from react-hook-form
    const targetPassword = values?.password || password;
    const targetFullName = values?.fullName || fullName;
    const targetEmail = values?.email || email;

    if (!targetPassword) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }
    if (targetPassword.length < 8) {
      setError('Mật khẩu phải từ 8 ký tự trở lên');
      return;
    }
    if (!targetFullName?.trim() || !targetEmail?.trim()) {
      setError('Vui lòng điền đầy đủ Tên hiển thị và Email');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const result = await createWallet(targetPassword, targetEmail.trim());
      // Save info that might not be in result
      localStorage.setItem('full_name', targetFullName.trim());
      localStorage.setItem('role', 'client');
      localStorage.setItem('isLoggedIn', 'true');

      setSeed(result.mnemonic.split(' '));
      setShowSeed(true);
      toast.success('Tạo ví thành công');
    } catch (err: any) {
      setError(err.message || 'Không thể tạo ví');
      toast.error(err.message || 'Không thể tạo ví');
    } finally {
      setIsLoading(false);
    }
  };

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
      navigate(role === 'admin' || role === 'moet' ? '/admin' : '/home');
      toast.success('Khôi phục ví thành công');
    } catch (err: any) {
      setError(err.message || 'Khôi phục ví thất bại');
      toast.error(err.message || 'Khôi phục ví thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchoolRegister = async (values?: any) => {
    const data = values || { schoolName, taxId, representative, email, phone, password };

    if (!data.schoolName || !data.taxId || !data.representative || !data.email || !data.phone || !data.password) {
      setError('Vui lòng điền đầy đủ các thông tin pháp lý và mật khẩu');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const result = await registerSchool(
        data.password,
        data.schoolName,
        data.taxId,
        data.representative,
        data.email,
        data.phone
      );

      localStorage.setItem('full_name', data.schoolName);

      // Gọi context.login() để AuthContext cập nhật isPendingApproval = true
      // registerSchool() đã gọi saveUserData() nên public_key đã có trong localStorage
      contextLogin({
        user: {
          address: result.address || localStorage.getItem('address') || '',
          role: 'validator',
          is_active: 0,
          full_name: data.schoolName,
          avatar_url: '',
          public_key: localStorage.getItem('public_key') || '',
        },
        token: localStorage.getItem('access_token') || '',
      });

      setSeed(result.mnemonic.split(' '));
      setShowSeed(true);
      toast.success('Đăng ký trường học thành công. Vui lòng chờ phê duyệt.');
    } catch (err: any) {
      setError(err.message || 'Đăng ký trường thất bại');
      toast.error(err.message || 'Đăng ký trường thất bại');
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
