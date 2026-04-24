import { ShieldCheck, KeyRound, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LoginButtonProps {
  onCreateWallet: () => void;
  onImportWallet: () => void;
  onRegisterSchool: () => void;
}

export default function LoginButton({ onCreateWallet, onImportWallet, onRegisterSchool }: LoginButtonProps) {
  return (
    <div className="w-full space-y-3">
      <Button
        onClick={onCreateWallet}
        className="w-full h-14 rounded-xl font-display font-semibold text-sm tracking-wide group"
      >
        Đăng ký tài khoản mới
        <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
      </Button>

      <Button
        variant="outline"
        onClick={onImportWallet}
        className="w-full h-14 rounded-xl font-display font-semibold text-sm tracking-wide border-border/60 hover:bg-secondary/60"
      >
        <KeyRound size={16} className="mr-2" />
        Đăng nhập hồ sơ cũ
      </Button>

      <Button
        variant="ghost"
        onClick={onRegisterSchool}
        className="w-full h-10 rounded-xl font-display font-medium text-sm text-primary hover:text-primary hover:bg-primary/10"
      >
        Dành cho Trường học / Tổ chức
      </Button>
    </div>
  );
}

export function WalletIcon() {
  return (
    <div className="mb-10 relative">
      <div className="w-24 h-24 rounded-2xl bg-primary flex items-center justify-center shadow-[0_8px_30px_-4px_hsla(0,0%,0%,0.25)]">
        <ShieldCheck className="w-12 h-12 text-primary-foreground" />
      </div>
      <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
          <path d="m9 12 2 2 4-4"/>
        </svg>
      </div>
    </div>
  );
}
