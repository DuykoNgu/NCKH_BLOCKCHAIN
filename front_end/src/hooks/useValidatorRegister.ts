import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerWallet } from '@/services/authService';
import { NetworkService } from '@/services/networkService';
import { encryptPrivateKey, uint8ArrayToHex } from '@/utils/cryptoVault';
import type { WalletData, NodeInfo } from '@/types/auth';

export const useValidatorRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [password, setPassword] = useState('');
  const [nodeInfo, setNodeInfo] = useState<NodeInfo>({
    ipAddress: '',
    port: '5000',
    universityName: '',
    universityCode: '',
    website: '',
    description: '',
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleWalletCreated = (w: WalletData, pw: string) => {
    setWallet(w);
    setPassword(pw);
    setStep(1);
  };

  const handleNodeInfoSubmit = (info: NodeInfo) => {
    setNodeInfo(info);
    setStep(2);
  };

  const handleRegister = async () => {
    if (!wallet || !password) return;

    setSubmitting(true);
    setError('');

    try {
      // 1. Mã hóa private key để lưu local (vault)
      const { encrypted, iv } = await encryptPrivateKey(wallet.privateKey, password);
      const vault = {
        encrypted: uint8ArrayToHex(encrypted),
        iv: uint8ArrayToHex(iv),
      };

      // Lưu thông tin cơ bản vào localStorage
      localStorage.setItem('address', wallet.address);
      localStorage.setItem('public_key', uint8ArrayToHex(wallet.publicKey));
      localStorage.setItem('vault', JSON.stringify(vault));

      // 2. Gọi API đăng ký qua service (Axios)
      await registerWallet(wallet.address, uint8ArrayToHex(wallet.publicKey), 'validator');

      // 3. Đăng ký Node Peer
      await NetworkService.registerPeer({
        ip_address: nodeInfo.ipAddress,
        port: parseInt(nodeInfo.port, 10),
        public_key: uint8ArrayToHex(wallet.publicKey),
        node_type: 'validator',
        university_name: nodeInfo.universityName,
        university_code: nodeInfo.universityCode,
        website: nodeInfo.website,
        description: nodeInfo.description,
      });

      setSuccess(true);
    } catch (err: any) {
      console.error('Registration failed:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      setError(errorMessage);
      setSuccess(false);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep(0);
    setWallet(null);
    setSuccess(false);
    setError('');
  };

  return {
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
    reset,
    navigate
  };
};
