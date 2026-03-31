import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Server, Activity, Shield, Cpu, RefreshCw, Wifi,
  WifiOff, Clock, CheckCircle
} from 'lucide-react';
import { NETWORK_SERVER } from '@/constants/api';
import { WalletIn4 } from '../home_common/WalletIn4';
import { TransactionList } from '../home_common/TransactionList';
import { BlockchainInfoCard } from '../home_common/BlockchainInfoCard';
import { Header } from './Header';

interface NetworkStats {
  total_peers: number;
  active_peers: number;
  pending_peers: number;
  validator_peers: number;
  slot_duration: number;
  is_time_synced: boolean;
}

interface SlotInfo {
  current_slot: number;
  leader_index: number;
  slot_duration: number;
  time_remaining_in_slot: number;
}

interface ValidatorDashboardProps {
  address: string;
  onDisconnect: () => void;
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  sub,
  badge,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  badge?: { label: string; variant: 'success' | 'warning' | 'default' };
}) => (
  <Card className="glass-card border-border/50 animate-enter-up">
    <CardContent className="pt-5 pb-4">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-4.5 h-4.5 text-primary" />
        </div>
        {badge && (
          <Badge className={
            badge.variant === 'success' ? 'bg-success/20 text-success border-success/30 text-[10px]' :
            badge.variant === 'warning' ? 'bg-warning/20 text-warning border-warning/30 text-[10px]' :
            'text-[10px]'
          }>
            {badge.label}
          </Badge>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
      {sub && <p className="text-[10px] text-muted-foreground/60 mt-1">{sub}</p>}
    </CardContent>
  </Card>
);

const NodeStatusCard = ({ stats, slot, loading }: {
  stats: NetworkStats | null;
  slot: SlotInfo | null;
  loading: boolean;
}) => {
  if (loading) {
    return (
      <Card className="glass-card border-border/50">
        <CardContent className="pt-5 flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const isSync = stats?.is_time_synced ?? false;

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Server className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-sm">Trạng thái Node</CardTitle>
              <CardDescription className="text-[10px]">Validator Node của bạn</CardDescription>
            </div>
          </div>
          <Badge className={isSync ? 'bg-success/20 text-success border-success/30' : 'bg-warning/20 text-warning border-warning/30'}>
            {isSync ? <><Wifi className="w-3 h-3 mr-1 inline" />Đồng bộ</> : <><WifiOff className="w-3 h-3 mr-1 inline" />Mất đồng bộ</>}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/40 rounded-xl p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Tổng Peers</p>
            <p className="text-lg font-bold">{stats?.total_peers ?? '—'}</p>
          </div>
          <div className="bg-muted/40 rounded-xl p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Peers Active</p>
            <p className="text-lg font-bold text-success">{stats?.active_peers ?? '—'}</p>
          </div>
          <div className="bg-muted/40 rounded-xl p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Validators</p>
            <p className="text-lg font-bold text-primary">{stats?.validator_peers ?? '—'}</p>
          </div>
          <div className="bg-muted/40 rounded-xl p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Chờ duyệt</p>
            <p className="text-lg font-bold text-warning">{stats?.pending_peers ?? '—'}</p>
          </div>
        </div>

        {slot && (
          <div className="border-t border-border/50 pt-3 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Slot hiện tại:</span>
              <span className="font-mono font-medium">#{slot.current_slot}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Activity className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Thời gian còn lại trong slot:</span>
              <span className="font-medium">{slot.time_remaining_in_slot?.toFixed(1)}s</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Leader index:</span>
              <span className="font-medium">{slot.leader_index}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const ValidatorDashboard = ({ address, onDisconnect }: ValidatorDashboardProps) => {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [slot, setSlot] = useState<SlotInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, slotRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}${NETWORK_SERVER.GET_STATS}`),
        fetch(`${import.meta.env.VITE_API_URL}${NETWORK_SERVER.GET_SLOT}?total_validators=3`),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (slotRes.ok) setSlot(await slotRes.json());
    } catch (err) {
      console.error('Failed to fetch validator data:', err);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">

        {/* Top stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Trạng thái Node"
            value={stats?.is_time_synced ? 'Active' : 'Syncing'}
            icon={Shield}
            badge={{ label: stats?.is_time_synced ? 'Online' : 'Offline', variant: stats?.is_time_synced ? 'success' : 'warning' }}
          />
          <StatCard
            title="Tổng Peers kết nối"
            value={loading ? '—' : stats?.total_peers ?? '—'}
            icon={Wifi}
            sub={`${stats?.active_peers ?? 0} đang hoạt động`}
          />
          <StatCard
            title="Slot hiện tại"
            value={loading ? '—' : slot?.current_slot ?? '—'}
            icon={Cpu}
            sub={`Leader: #${slot?.leader_index ?? '—'}`}
          />
          <StatCard
            title="Mempool"
            value="—"
            icon={Activity}
            sub="Chờ cập nhật API"
          />
        </div>

        {/* Main content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-1 space-y-6">
            <WalletIn4 address={address} onDisconnect={onDisconnect} />
            <NodeStatusCard stats={stats} slot={slot} loading={loading} />
            <BlockchainInfoCard />
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick actions */}
            <Card className="glass-card border-border/50">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Bảng điều khiển Validator</CardTitle>
                  <CardDescription className="text-xs">
                    Cập nhật lần cuối: {lastRefresh.toLocaleTimeString('vi-VN')}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                  Làm mới
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                    <Shield className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-xs font-medium text-foreground">Xác minh NFT</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Kiểm tra tính hợp lệ</p>
                  </div>
                  <div className="bg-muted/50 border border-border/50 rounded-xl p-4 text-center">
                    <Server className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs font-medium text-foreground">Cấp phát NFT</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Tạo chứng chỉ mới</p>
                  </div>
                  <div className="bg-muted/50 border border-border/50 rounded-xl p-4 text-center">
                    <Activity className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs font-medium text-foreground">Xem Blocks</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Lịch sử blockchain</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <TransactionList />
          </div>
        </div>
      </main>
    </div>
  );
};
