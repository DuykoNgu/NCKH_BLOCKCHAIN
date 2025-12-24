import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button} from "@/components/ui/button";
import { Copy, ExternalLink, LogOut, TestTube } from 'lucide-react';
import Logo3D from '@/components/common/loginpage_common/Logo3D';
import { useRadixToast } from "@/hooks/use-radix-toast";
import api from "@configs/axios.config";
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

  const testCreateBlock = async () => {
    // required_fields = ['index', 'block_id', 'pre_hash', 'merkle_root', 
    //                       'validator_pubkey', 'private_key']
    try {
      // Sample data for testing the block creation API
      const blockData = {
        index: 1,
        block_id: "BLOCK_3",
        pre_hash: "0000000000000000000000000000000000000000000000000000000000000000",
        merkle_root: "123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0",
        validator_pubkey: "04a5c6d7e8f90123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789a",
        private_key: "123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0",
        transactions: []
      };

      console.log('Sending block creation request with data:', blockData);

      const response = await api.post('/v1/block/create', blockData);

      console.log('Block creation response:', response.data);

      showToast({
        title: 'Thành công!',
        description: 'Block đã được tạo thành công.',
      });
    } catch (error: any) {
      console.error('Block creation error:', error.response?.data || error.message);

      showToast({
        title: 'Lỗi!',
        description: 'Không thể tạo block. Xem console để biết chi tiết.',
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

        <Button
          variant="outline"
          className="w-full border-blue-500/50 text-blue-500"
          onClick={testCreateBlock}
        >
          <TestTube className="w-4 h-4 mr-2" />
          Test Create Block
        </Button>
      </CardContent>
    </Card>
  );
};
