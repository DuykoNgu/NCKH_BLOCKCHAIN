import { Activity, ShieldCheck, Box } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const NetworkStatus = () => {
  return (
    <Card className="glass-card">
      <CardHeader className="py-4 border-b border-border/50">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <ShieldCheck className="w-5 h-5 text-green-500" />
          Tiêu chuẩn Hệ thống
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        
        <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors">
          <div className="mt-0.5 w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-0.5">Không thể làm giả</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dữ liệu bằng cấp được bảo vệ bởi Blockchain, vĩnh viễn không thể bị thay đổi.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors">
          <div className="mt-0.5 w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-0.5">Xác minh tức thì</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Nhà tuyển dụng có thể kiểm tra tính hợp lệ của bằng cấp chỉ trong vài giây.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors">
          <div className="mt-0.5 w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
            <Box className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-0.5">Quyền sở hữu thuộc về bạn</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ví của bạn là chìa khóa duy nhất để quản lý các bằng cấp điện tử này.
            </p>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};
