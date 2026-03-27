import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, ShieldCheck, Zap } from 'lucide-react';

export const BlockchainInfoCard = () => {
  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm font-semibold">Thông tin Mạng lưới</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-green-500/10 text-green-500 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">Bảo mật đa lớp</p>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Tất cả chứng chỉ được mã hóa và lưu trữ trên blockchain EduChain, đảm bảo tính toàn vẹn và không thể bị sửa đổi.
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">Xác thực tức thì</p>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Sử dụng QR Code hoặc ID định danh để xác minh tính chính danh của bằng cấp chỉ trong vài giây.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
