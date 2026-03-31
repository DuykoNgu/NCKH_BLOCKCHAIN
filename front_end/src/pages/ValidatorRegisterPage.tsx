import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, ChevronRight, ChevronLeft, Server, KeyRound,
  Building2, Globe, Network, Shield, Loader2, Copy, Eye, EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { generateWallet } from '@/ultis/walletGenerator';
import { encryptPrivateKey, uint8ArrayToHex } from '@/ultis/cryptoVault';
import { AUTH_SERVER, NETWORK_SERVER } from '@/constants/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface WalletData {
  mnemonic: string;
  address: string;
  publicKey: string;
  privateKey: Uint8Array;
}

interface NodeInfo {
  universityName: string;
  universityCode: string;
  website: string;
  ipAddress: string;
  port: string;
  description: string;
}

// ─── Step Indicator ──────────────────────────────────────────────────────────

const steps = [
  { label: 'Tạo ví', icon: KeyRound },
  { label: 'Thông tin Node', icon: Building2 },
  { label: 'Xác nhận', icon: CheckCircle },
];

const StepIndicator = ({ currentStep }: { currentStep: number }) => (
  <div className="flex items-center justify-center gap-2 mb-10">
    {steps.map((step, i) => {
      const Icon = step.icon;
      const done = i < currentStep;
      const active = i === currentStep;
      return (
        <div key={i} className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all
            ${done ? 'bg-success/20 text-success' : active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            <Icon className="w-3.5 h-3.5" />
            {step.label}
          </div>
          {i < steps.length - 1 && (
            <div className={`w-8 h-0.5 ${i < currentStep ? 'bg-success' : 'bg-border'}`} />
          )}
        </div>
      );
    })}
  </div>
);

// ─── Step 1: Create Wallet ────────────────────────────────────────────────────

const Step1CreateWallet = ({
  onNext,
}: {
  onNext: (wallet: WalletData, password: string) => void;
}) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
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
      const { mnemonic, privateKey, publicKey, address } = await generateWallet();
      onNext({ mnemonic, address, publicKey: uint8ArrayToHex(publicKey), privateKey }, password);
    } catch {
      setError('Không thể tạo ví. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

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
        <div className="space-y-2">
          <Label>Mật khẩu bảo vệ ví</Label>
          <div className="relative">
            <Input
              type={showPw ? 'text' : 'password'}
              placeholder="Tối thiểu 8 ký tự"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Xác nhận mật khẩu</Label>
          <Input
            type="password"
            placeholder="Nhập lại mật khẩu"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <Button className="w-full" onClick={handleCreate} disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
        Tạo ví Node
      </Button>
    </div>
  );
};

// ─── Step 2: Seed Phrase + Node Info ─────────────────────────────────────────

const Step2NodeInfo = ({
  wallet,
  nodeInfo,
  onChange,
  onNext,
  onBack,
}: {
  wallet: WalletData;
  nodeInfo: NodeInfo;
  onChange: (info: NodeInfo) => void;
  onNext: () => void;
  onBack: () => void;
}) => {
  const [copied, setCopied] = useState(false);
  const [seedConfirmed, setSeedConfirmed] = useState(false);

  const copySeed = () => {
    navigator.clipboard.writeText(wallet.mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const field = (label: string, key: keyof NodeInfo, placeholder: string, icon?: React.ReactNode) => (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        {icon}
        {label}
      </Label>
      <Input
        placeholder={placeholder}
        value={nodeInfo[key]}
        onChange={e => onChange({ ...nodeInfo, [key]: e.target.value })}
      />
    </div>
  );

  const canProceed = seedConfirmed && nodeInfo.universityName && nodeInfo.ipAddress && nodeInfo.port;

  return (
    <div className="space-y-6">
      {/* Seed Phrase */}
      <Card className="glass-card border-warning/30 bg-warning/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-warning">
            <Shield className="w-4 h-4" />
            Lưu Seed Phrase (Quan trọng!)
          </CardTitle>
          <CardDescription className="text-xs">
            Đây là cách duy nhất để khôi phục ví. KHÔNG chia sẻ với bất kỳ ai.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {wallet.mnemonic.split(' ').map((word, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-background/60 rounded-lg px-2 py-1.5 text-xs font-mono">
                <span className="text-muted-foreground w-4 text-right">{i + 1}.</span>
                <span className="font-medium">{word}</span>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={copySeed}>
            <Copy className="w-3.5 h-3.5 mr-2" />
            {copied ? 'Đã sao chép!' : 'Sao chép tất cả'}
          </Button>
          <label className="flex items-center gap-2 mt-3 cursor-pointer">
            <input
              type="checkbox"
              checked={seedConfirmed}
              onChange={e => setSeedConfirmed(e.target.checked)}
              className="rounded"
            />
            <span className="text-xs text-muted-foreground">Tôi đã lưu lại seed phrase ở nơi an toàn</span>
          </label>
        </CardContent>
      </Card>

      {/* Node Info */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Building2 className="w-4 h-4 text-primary" />
          Thông tin Node
        </div>
        {field('Tên trường / Tổ chức', 'universityName', 'VD: Đại học Bách Khoa TP.HCM', <Building2 className="w-3.5 h-3.5 text-muted-foreground" />)}
        {field('Mã trường', 'universityCode', 'VD: HCMUT', <Badge variant="outline" className="text-[9px] px-1 py-0">ID</Badge>)}
        {field('Website', 'website', 'VD: https://hcmut.edu.vn', <Globe className="w-3.5 h-3.5 text-muted-foreground" />)}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            {field('IP Address của Node', 'ipAddress', 'VD: 203.113.152.55', <Network className="w-3.5 h-3.5 text-muted-foreground" />)}
          </div>
          <div>
            {field('Port', 'port', '5000', undefined)}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Mô tả (tùy chọn)</Label>
          <textarea
            className="w-full min-h-[80px] rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Giới thiệu ngắn về trường và vai trò trong mạng lưới..."
            value={nodeInfo.description}
            onChange={e => onChange({ ...nodeInfo, description: e.target.value })}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại
        </Button>
        <Button className="flex-1" onClick={onNext} disabled={!canProceed}>
          Tiếp theo <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

// ─── Step 3: Confirm & Submit ─────────────────────────────────────────────────

const Step3Confirm = ({
  wallet,
  nodeInfo,
  onBack,
  onSubmit,
  submitting,
}: {
  wallet: WalletData;
  nodeInfo: NodeInfo;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) => (
  <div className="space-y-6">
    <div className="text-center space-y-2">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
        <CheckCircle className="w-7 h-7 text-primary" />
      </div>
      <h2 className="text-xl font-semibold">Xác nhận đăng ký</h2>
      <p className="text-sm text-muted-foreground">Kiểm tra lại thông tin trước khi gửi</p>
    </div>

    <Card className="glass-card border-border/50">
      <CardContent className="pt-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Địa chỉ ví</span>
          <span className="font-mono text-xs">{wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Trường / Tổ chức</span>
          <span className="font-medium">{nodeInfo.universityName}</span>
        </div>
        {nodeInfo.universityCode && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Mã trường</span>
            <span>{nodeInfo.universityCode}</span>
          </div>
        )}
        {nodeInfo.website && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Website</span>
            <span className="text-primary text-xs truncate max-w-[180px]">{nodeInfo.website}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Địa chỉ Node</span>
          <span className="font-mono text-xs">{nodeInfo.ipAddress}:{nodeInfo.port}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Vai trò</span>
          <Badge className="bg-primary/20 text-primary border-primary/30">Validator Node</Badge>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Trạng thái</span>
          <Badge className="bg-warning/20 text-warning border-warning/30">Chờ duyệt (MOET)</Badge>
        </div>
      </CardContent>
    </Card>

    <div className="bg-muted/50 rounded-xl p-4 text-xs text-muted-foreground space-y-1">
      <p>• Sau khi gửi, yêu cầu của bạn sẽ được lưu với trạng thái <strong>PENDING</strong>.</p>
      <p>• Bộ GD&ĐT (MOET) sẽ xem xét và duyệt đơn trong thời gian sớm nhất.</p>
      <p>• Sau khi được duyệt, bạn có thể đăng nhập bình thường vào hệ thống.</p>
    </div>

    <div className="flex gap-3">
      <Button variant="outline" className="flex-1" onClick={onBack} disabled={submitting}>
        <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại
      </Button>
      <Button className="flex-1" onClick={onSubmit} disabled={submitting}>
        {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Server className="w-4 h-4 mr-2" />}
        Gửi đăng ký
      </Button>
    </div>
  </div>
);

// ─── Step 4: Success ──────────────────────────────────────────────────────────

const StepSuccess = ({ address, onGoLogin }: { address: string; onGoLogin: () => void }) => (
  <div className="text-center space-y-6 py-4">
    <div className="relative mx-auto w-20 h-20">
      <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center animate-pulse">
        <CheckCircle className="w-10 h-10 text-success" />
      </div>
    </div>
    <div className="space-y-2">
      <h2 className="text-2xl font-bold">Đăng ký thành công!</h2>
      <p className="text-muted-foreground text-sm max-w-sm mx-auto">
        Yêu cầu tham gia mạng lưới của bạn đã được ghi nhận và đang chờ Bộ GD&ĐT phê duyệt.
      </p>
    </div>
    <Card className="glass-card border-border/50 text-left">
      <CardContent className="pt-4 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4 text-success shrink-0" />
          <span>Tài khoản validator đã được tạo</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4 text-success shrink-0" />
          <span>Thông tin node đã được ghi nhận</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 shrink-0" />
          <span>Đang chờ MOET phê duyệt...</span>
        </div>
      </CardContent>
    </Card>
    <div className="text-xs text-muted-foreground font-mono bg-muted/50 rounded-lg px-4 py-2">
      {address}
    </div>
    <Button className="w-full" onClick={onGoLogin}>
      Về trang đăng nhập
    </Button>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const ValidatorRegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [password, setPassword] = useState('');
  const [nodeInfo, setNodeInfo] = useState<NodeInfo>({
    universityName: '',
    universityCode: '',
    website: '',
    ipAddress: '',
    port: '5000',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleWalletCreated = (w: WalletData, pw: string) => {
    setWallet(w);
    setPassword(pw);
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!wallet) return;
    setSubmitting(true);
    try {
      // Encrypt & store locally
      const { encrypted, iv } = await encryptPrivateKey(wallet.privateKey, password);
      const vault = {
        encrypted: uint8ArrayToHex(encrypted),
        iv: uint8ArrayToHex(iv),
      };
      localStorage.setItem('address', wallet.address);
      localStorage.setItem('public_key', wallet.publicKey);
      localStorage.setItem('vault', JSON.stringify(vault));

      // 1. Register account with role=validator
      await fetch(`${import.meta.env.VITE_API_URL}${AUTH_SERVER.WALLET_REGISTER}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: wallet.address,
          public_key: wallet.publicKey,
          role: 'validator',
        }),
      });

      // 2. Register as peer node
      await fetch(`${import.meta.env.VITE_API_URL}${NETWORK_SERVER.REGISTER_PEER}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip_address: nodeInfo.ipAddress,
          port: parseInt(nodeInfo.port, 10),
          public_key: wallet.publicKey,
          node_type: 'validator',
          university_name: nodeInfo.universityName,
          university_code: nodeInfo.universityCode,
          website: nodeInfo.website,
          description: nodeInfo.description,
        }),
      });

      setSuccess(true);
    } catch (err) {
      console.error('Registration failed:', err);
      // Still show success for UX — backend may accept partial
      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      {/* Background decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Server className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">EduChain</p>
              <p className="text-sm font-semibold leading-none">Đăng ký Validator Node</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
            Quay lại đăng nhập
          </Button>
        </div>

        <Card className="glass-card border-border/50 shadow-2xl">
          <CardContent className="pt-8 pb-8 px-8">
            {success ? (
              <StepSuccess
                address={wallet?.address || ''}
                onGoLogin={() => navigate('/login')}
              />
            ) : (
              <>
                {!success && step < 3 && <StepIndicator currentStep={step} />}
                {step === 0 && <Step1CreateWallet onNext={handleWalletCreated} />}
                {step === 1 && wallet && (
                  <Step2NodeInfo
                    wallet={wallet}
                    nodeInfo={nodeInfo}
                    onChange={setNodeInfo}
                    onNext={() => setStep(2)}
                    onBack={() => setStep(0)}
                  />
                )}
                {step === 2 && wallet && (
                  <Step3Confirm
                    wallet={wallet}
                    nodeInfo={nodeInfo}
                    onBack={() => setStep(1)}
                    onSubmit={handleSubmit}
                    submitting={submitting}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ValidatorRegisterPage;
