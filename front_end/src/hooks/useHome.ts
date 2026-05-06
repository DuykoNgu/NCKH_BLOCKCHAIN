import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { useNavigate } from 'react-router-dom';

export const useHome = () => {
  const { user, logout } = useAuth();
  const { lock } = useWallet();
  const navigate = useNavigate();

  const handleDisconnect = () => {
    lock();
    logout();
    navigate('/login');
  };

  const isPendingValidator = user?.role === 'validator' && user?.is_active === 0;

  return {
    user,
    address: user?.address || '',
    isPendingValidator,
    handleDisconnect,
  };
};
