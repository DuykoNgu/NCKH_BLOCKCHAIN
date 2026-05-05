import { useState } from 'react';
import { ArrowLeft, Copy, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SeedDisplayProps {
  seed: string[];
  onBack: () => void;
  onConfirmed: () => void;
}

export default function SeedDisplay({ seed, onBack, onConfirmed }: SeedDisplayProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(seed.join(' '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = () => {
    if (confirmed) {
      onConfirmed();
    }
  };

  return (
    <div className="glass-card rounded-2xl p-10 shadow-[0_8px_40px_-12px_hsla(0,0%,0%,0.08)]">
      <div className="flex flex-col">
        <button onClick={onBack} className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 self-start">
          <ArrowLeft size={16} className="mr-1" /> Quay lại
        </button>

        <h2 className="font-display text-xl font-bold text-foreground mb-1">Cụm từ khôi phục</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Lưu lại 12 từ này ở nơi an toàn. Đây là cách duy nhất để khôi phục ví.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {seed.map((word, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl bg-secondary/50 border border-border/30 px-3 py-2.5 hover:bg-secondary/80 transition-colors">
              <span className="text-[10px] text-muted-foreground font-mono w-4 text-right opacity-50">{i + 1}</span>
              <span className="text-sm font-mono font-medium text-foreground">{word}</span>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          onClick={handleCopy}
          className="w-full h-11 rounded-xl text-sm mb-6 border-border/60 bg-secondary/30 hover:bg-secondary/50"
        >
          {copied ? <CheckCheck size={16} className="mr-2 text-green-600" /> : <Copy size={16} className="mr-2" />}
          {copied ? 'Đã sao chép!' : 'Sao chép cụm từ'}
        </Button>

        <div className="space-y-4">
          <label className="flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-secondary/20 cursor-pointer hover:bg-secondary/40 transition-colors group">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-4 h-4 rounded border-border/50 text-primary focus:ring-primary/30"
            />
            <span className="text-muted-foreground text-xs group-hover:text-foreground transition-colors">Tôi đã lưu lại cụm từ khôi phục an toàn</span>
          </label>

          <Button
            onClick={handleConfirm}
            disabled={!confirmed}
            className="w-full h-12 rounded-xl font-display font-semibold text-sm shadow-lg shadow-primary/20"
          >
            Tiếp tục vào Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
