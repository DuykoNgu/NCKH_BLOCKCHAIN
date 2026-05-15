import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, LogOut, Settings } from 'lucide-react';
import { toast } from "sonner";
import { UserAvatar } from "../UserAvatar";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { ProfileSettings } from "../profile/ProfileSettings";

interface WalletCardProps {
  address: string;
  onDisconnect: () => void;
}

export const WalletInfo = ({
  address,
  onDisconnect,
}: WalletCardProps) => {
  const { fullName, avatarUrl } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  const formatAddress = (addr: string) => {
    if (!addr) return 'Chưa kết nối';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      toast.success('Đã sao chép!', {
        description: 'Địa chỉ đã được sao chép vào clipboard.',
      });
    } catch (error) {
      console.error('Failed to copy address:', error);
      toast.error('Không thể sao chép địa chỉ.');
    }
  };

  if (showSettings) {
    return <ProfileSettings onBack={() => setShowSettings(false)} />;
  }

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Tài khoản của tôi</CardTitle>
        <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
          <Settings className="w-4 h-4 text-muted-foreground" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
          <div className="flex items-center gap-3">
            <UserAvatar address={address} avatarUrl={avatarUrl} size={48} />
            <div className="overflow-hidden">
              <p className="font-semibold text-foreground truncate max-w-[250px]">
                {fullName || 'Người dùng mới'}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {formatAddress(address)}
              </p>
            </div>
          </div>

          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={copyAddress} className="h-8 w-8">
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full border-destructive/20 text-destructive hover:bg-destructive/5"
          onClick={onDisconnect}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Đăng xuất
        </Button>
      </CardContent>
    </Card>
  );
};
