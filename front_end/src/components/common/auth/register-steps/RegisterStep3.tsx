import React from 'react';
import { CheckCircle, ChevronLeft, Loader2, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { WalletData, NodeInfo } from '@/types/auth';

interface RegisterStep3Props {
  wallet: WalletData;
  nodeInfo: NodeInfo;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}

const RegisterStep3: React.FC<RegisterStep3Props> = ({
  wallet,
  nodeInfo,
  onBack,
  onSubmit,
  submitting,
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

export default RegisterStep3;
