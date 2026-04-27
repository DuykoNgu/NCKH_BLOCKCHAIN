import { Award, CheckCircle, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { TRANSACTION_SERVER } from '@/constants/api';
export type Dictionary<T> = Record<string, T>;
interface Transaction {
    tx_hash: string;
    payload: Dictionary<string>;
    timestamp: number;
    status: 'pending' | 'completed';
    sender_address: string;
}
interface Activity {
  id: string;
  type: 'mint' | 'verify' | 'revoke' | 'register' | 'unknown';
  title: string;
  address: string;
  time: string;
  status: 'completed' | 'pending';
}

const formatDistanceToNow = (timestamp: number) => {
  const diff = Date.now() - (timestamp * 1000);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} ngày trước`;
  if (hours > 0) return `${hours} giờ trước`;
  if (minutes > 0) return `${minutes} phút trước`;
  return 'Vừa xong';
};

const getTitleByType = (payload: Dictionary<string>) => {
  const op = payload?.op || '';
  if (op === 'mint_nft') return 'Cấp bằng mới';
  if (op === 'verify_nft') return 'Xác minh chứng chỉ';
  if (op === 'revoke_nft') return 'Thu hồi chứng chỉ';
  if (op === 'register_user') return 'Đăng ký người dùng';
  return 'Hoạt động hệ thống';
};

const getTypeByOp = (op: string): Activity['type'] => {
  if (op === 'mint_nft') return 'mint';
  if (op === 'revoke_nft') return 'revoke';
  return 'verify';
};

export const TransactionList = () => {
  const { address, isAdmin, isValidator } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  
  const title = (isAdmin || isValidator) ? "Hoạt động mạng lưới" : "Nhật ký hoạt động";

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const url = (isAdmin || isValidator) 
          ? `${import.meta.env.VITE_API_URL}${TRANSACTION_SERVER.GET_ALL}`
          : `${import.meta.env.VITE_API_URL}${TRANSACTION_SERVER.GET_BY_ADDRESS.replace(':address', address || '')}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.success && data.transactions) {
          const mapped: Activity[] = data.transactions.map((tx: Transaction) => ({
            id: tx.tx_hash,
            type: getTypeByOp(tx.payload?.op),
            title: getTitleByType(tx.payload),
            address: tx.sender_address.slice(0, 6) + '...' + tx.sender_address.slice(-4),
            time: formatDistanceToNow(tx.timestamp),
            status: 'completed' // In our local DB, stored txs are usually confirmed
          }));
          setActivities(mapped.slice(0, 5)); // Show latest 5
        }
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      fetchActivities();
    }
  }, [address, isAdmin, isValidator]);

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-border/50">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>
      <div className="divide-y divide-border/50">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            <Clock className="w-8 h-8 animate-spin mx-auto mb-2 opacity-20" />
            <p className="text-sm">Đang tải hoạt động...</p>
          </div>
        ) : activities.length > 0 ? (
          activities.map((activity) => (
            <div 
              key={activity.id} 
              className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  activity.type === 'mint' 
                    ? 'bg-success/20 text-success' 
                    : activity.type === 'revoke'
                    ? 'bg-destructive/20 text-destructive'
                    : 'bg-primary/20 text-primary'
                }`}>
                  {activity.type === 'mint' && <Award className="w-5 h-5" />}
                  {activity.type === 'verify' && <ShieldCheck className="w-5 h-5" />}
                  {activity.type === 'revoke' && <CheckCircle className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {activity.title}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-1 text-sm text-muted-foreground">
                  {activity.status === 'pending' && <Clock className="w-3 h-3" />}
                  <span>{activity.time}</span>
                </div>
                <p className={`text-xs mt-1 ${
                  activity.status === 'completed' ? 'text-success' : 'text-warning'
                }`}>
                  {activity.status === 'completed' ? 'Đã xác nhận' : 'Đang xử lý'}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Chưa có hoạt động nào</p>
          </div>
        )}
      </div>
    </div>
  );
};