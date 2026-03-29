import { Award, Activity, Shield, Users, Server } from 'lucide-react';
import { StatCard } from '@/components/common/layout/StatCard';
import { useAuth } from '@/hooks/useAuth';

export const StatGridContent = () => {
  const { isValidator, isUser } = useAuth();

  if (isUser) {
    return null;
  }

  if (isValidator) {
    return (
      <>
        <StatCard title="Trạng thái Node" value="Active" icon={Shield} />
        <StatCard title="Blocks đã đào" value="1,240" icon={Server} />
        <StatCard title="Mempool" value="45" icon={Activity} />
      </>
    );
  }

  return (
    <>
      <StatCard title="Tổng người dùng" value="1,245" icon={Users} />
      <StatCard title="Tổng NFT Phát hành" value="15,600" icon={Award} />
      <StatCard title="Sức khỏe mạng" value="Excellent" icon={Activity} />
      <StatCard title="Số lượng Node" value="8" icon={Server} />
    </>
  );
};

