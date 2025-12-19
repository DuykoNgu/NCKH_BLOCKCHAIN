import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button} from "@/components/ui/button";
import { Copy, ExternalLink, LogOut } from 'lucide-react';
import Logo3D from '@/components/common/loginpage_common/Logo3D';
import { useRadixToast } from "@/hooks/use-radix-toast";


interface WalletCardProps {
  address: string;
  balance: string | null;
  chainId: string | null;
  onDisconnect: () => void;
}

export const WalletIn4 = ({
  address,
  balance,
  chainId,
  onDisconnect,
}: WalletCardProps) => {
  const {showToast} = useRadixToast()

  const formatAddress = (addr: string) => {
    if (!addr) return 'Chưa kết nối';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      showToast({
        title: 'Đã sao chép!',
        description: 'Địa chỉ ví đã được sao chép vào clipboard.',
      });
    } catch (error) {
      console.error('Failed to copy address:', error);
      showToast({
        title: 'Lỗi!',
        description: 'Không thể sao chép địa chỉ ví.',
      });
    }
  };

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Ví của tôi</CardTitle>
        <Badge variant="secondary" className="bg-success/20 text-success border-0">
          {chainId ?? 'Unknown'}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <Logo3D width={60} height={60} disableRotation={false} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Địa chỉ</p>
              <p className="font-mono font-medium">
                {formatAddress(address)}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={copyAddress}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-accent/20">
          <p className="text-sm text-muted-foreground mb-1">Số dư</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">
              {balance ?? '0.0000'}
            </span>
            <span className="text-lg text-muted-foreground">ETH</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full border-destructive/50 text-destructive"
          onClick={onDisconnect}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Ngắt kết nối
        </Button>
      </CardContent>
    </Card>
  );
};
