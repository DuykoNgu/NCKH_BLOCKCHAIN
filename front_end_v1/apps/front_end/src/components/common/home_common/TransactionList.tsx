import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'send' | 'receive';
  amount: string;
  symbol: string;
  address: string;
  time: string;
  status: 'completed' | 'pending';
}

const mockTransactions: Transaction[] = [
  { id: '1', type: 'receive', amount: '+0.5', symbol: 'ETH', address: '0x1234...5678', time: '2 giờ trước', status: 'completed' },
  { id: '2', type: 'send', amount: '-100', symbol: 'USDC', address: '0xabcd...efgh', time: '5 giờ trước', status: 'completed' },
  { id: '3', type: 'receive', amount: '+25', symbol: 'LINK', address: '0x9876...5432', time: '1 ngày trước', status: 'completed' },
  { id: '4', type: 'send', amount: '-0.1', symbol: 'ETH', address: '0xijkl...mnop', time: '2 ngày trước', status: 'pending' },
];

export const TransactionList = () => {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-border/50">
        <h2 className="text-lg font-semibold text-foreground">Giao dịch gần đây</h2>
      </div>
      <div className="divide-y divide-border/50">
        {mockTransactions.map((tx) => (
          <div 
            key={tx.id} 
            className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                tx.type === 'receive' 
                  ? 'bg-success/20 text-success' 
                  : 'bg-accent/20 text-accent'
              }`}>
                {tx.type === 'receive' ? (
                  <ArrowDownLeft className="w-5 h-5" />
                ) : (
                  <ArrowUpRight className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {tx.type === 'receive' ? 'Nhận' : 'Gửi'}
                </p>
                <p className="text-sm text-muted-foreground">{tx.address}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-medium ${
                tx.type === 'receive' ? 'text-success' : 'text-foreground'
              }`}>
                {tx.amount} {tx.symbol}
              </p>
              <div className="flex items-center justify-end gap-1 text-sm text-muted-foreground">
                {tx.status === 'pending' && <Clock className="w-3 h-3" />}
                <span>{tx.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};