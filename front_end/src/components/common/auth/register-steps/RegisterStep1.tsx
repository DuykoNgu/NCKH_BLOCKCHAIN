import React, { useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/common/PasswordInput';

import type { WalletData } from '@/types/auth';
import { generateWallet } from '@/utils/walletGenerator';

interface RegisterStep1Props {
  onCreate: (wallet: WalletData, password: string) => void;
  isLoading: boolean;
}

const RegisterStep1: React.FC<RegisterStep1Props> = ({ onCreate, isLoading }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }
    if (password !== confirm) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const wallet = await generateWallet();
      onCreate(wallet, password);
    } catch (err) {
      setError('Lỗi tạo ví. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const isBtnLoading = isLoading || loading;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <KeyRound className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Tạo ví cho Node</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Ví này sẽ là danh tính của trường bạn trên mạng lưới EduChain. Hãy bảo quản mật khẩu cẩn thận.
        </p>
      </div>

      <div className="space-y-4">
        <PasswordInput
          label="Mật khẩu bảo vệ ví"
          placeholder="Tối thiểu 8 ký tự"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <PasswordInput
          label="Xác nhận mật khẩu"
          placeholder="Nhập lại mật khẩu"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          error={error}
        />
      </div>

      <Button className="w-full h-11" onClick={handleCreate} disabled={isBtnLoading}>
        {isBtnLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
        Tạo ví Node
      </Button>
    </div>
  );
};

export default RegisterStep1;
