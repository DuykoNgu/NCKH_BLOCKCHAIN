import { Wallet, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { StatCard } from '@/components/common/StatCard';

export const StatGridContent = () => {
  return (
    <>
      <StatCard
        title="Tổng tài sản"
        value="$8,544.82"
        icon={Wallet}
      />
      <StatCard
        title="NFTs"
        value="12"
        icon={TrendingUp}
      />
      <StatCard
        title="Transactions"
        value="156"
        icon={Activity}
      />
      <StatCard
        title="Balance"
        value="$5,200.00"
        icon={DollarSign}
      />
    </>
  );
};

