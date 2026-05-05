import React from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface RegisterSuccessProps {
  onGoLogin: () => void;
}

const RegisterSuccess: React.FC<RegisterSuccessProps> = ({ onGoLogin }) => (
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

    <Button className="w-full" onClick={onGoLogin}>
      Quay lại Đăng nhập
    </Button>
  </div>
);

export default RegisterSuccess;
