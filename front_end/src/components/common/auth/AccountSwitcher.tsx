import { Button } from '@/components/ui/button';
import { User, Plus, Building2 } from 'lucide-react';

interface Account {
  address: string;
  full_name?: string;
  role: string;
}

interface AccountSwitcherProps {
  accounts: Account[];
  onSelect: (address: string) => void;
  onAddNew: () => void;
  onBack: () => void;
}

const AccountSwitcher = ({ accounts, onSelect, onAddNew, onBack }: AccountSwitcherProps) => {
  return (
    <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300">
      <h2 className="font-display text-xl font-bold text-foreground mb-1 text-center">Chọn tài khoản</h2>
      <p className="text-sm text-muted-foreground mb-6 text-center">
        Chọn ví bạn muốn sử dụng để đăng nhập
      </p>

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 mb-6 custom-scrollbar">
        {accounts.map((acc) => (
          <button
            key={acc.address}
            onClick={() => onSelect(acc.address)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 border border-border/50 hover:border-primary/30 transition-all text-left group"
          >
            <div className={`h-10 w-10 rounded-lg ${acc.role === 'validator' ? 'bg-orange-500/10' : 'bg-primary/10'} flex items-center justify-center`}>
              {acc.role === 'validator' ? (
                <Building2 className="h-5 w-5 text-orange-500" />
              ) : (
                <User className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {acc.full_name || (acc.role === 'validator' ? 'Cơ sở giáo dục' : 'Ví cá nhân')}
              </p>
              <p className="text-[10px] font-mono text-muted-foreground truncate">
                {acc.address.slice(0, 10)}...{acc.address.slice(-8)}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <Button
          variant="outline"
          onClick={onAddNew}
          className="w-full h-11 rounded-xl border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all text-sm font-medium gap-2"
        >
          <Plus size={16} /> Thẻ mới / Nhập ví khác
        </Button>
        <button
          onClick={onBack}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          ← Quay lại
        </button>
      </div>
    </div>
  );
};

export default AccountSwitcher;
