import React, { useState } from 'react';
import { Shield, Copy, Building2, Globe, Network, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { WalletData, NodeInfo } from '@/types/auth';

interface RegisterStep2Props {
  wallet: WalletData;
  nodeInfo: NodeInfo;
  onChange: (info: NodeInfo) => void;
  onNext: () => void;
  onBack: () => void;
}

const RegisterStep2: React.FC<RegisterStep2Props> = ({
  wallet,
  nodeInfo,
  onChange,
  onNext,
  onBack,
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

export default RegisterStep2;
