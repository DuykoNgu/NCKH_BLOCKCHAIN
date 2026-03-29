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
    <div className="flex flex-col">
      <button onClick={onBack} className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 self-start">
        <ArrowLeft size={16} className="mr-1" /> Quay lại
      </button>

      <h2 className="font-display text-xl font-bold text-foreground mb-1">Cụm từ khôi phục</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Lưu lại 12 từ này ở nơi an toàn. Đây là cách duy nhất để khôi phục ví.
      </p>

      <div className="grid grid-cols-3 gap-2 mb-6">
        {seed.map((word, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg bg-secondary/60 border border-border/40 px-3 py-2.5">
            <span className="text-xs text-muted-foreground font-mono w-4 text-right">{i + 1}</span>
            <span className="text-sm font-mono text-foreground">{word}</span>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        onClick={handleCopy}
        className="w-full h-11 rounded-xl text-sm mb-4 border-border/60"
      >
        {copied ? <CheckCheck size={16} className="mr-2 text-green-600" /> : <Copy size={16} className="mr-2" />}
        {copied ? 'Đã sao chép!' : 'Sao chép cụm từ'}
      </Button>

      <label className="flex items-center gap-2 mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="w-4 h-4 rounded"
        />
        <span className="text-foreground text-sm">Tôi đã lưu lại cụm từ khôi phục</span>
      </label>

      <Button
        onClick={handleConfirm}
        disabled={!confirmed}
        className="w-full h-12 rounded-xl font-display font-semibold text-sm"
      >
        Tôi đã lưu lại rồi
      </Button>
    </div>
  );
}
