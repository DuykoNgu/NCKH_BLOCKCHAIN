import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, className, ...props }, ref) => {
    const [showPw, setShowPw] = useState(false);

    return (
      <div className="space-y-2">
        {label && <Label>{label}</Label>}
        <div className="relative">
          <Input
            ref={ref}
            type={showPw ? 'text' : 'password'}
            className={cn(
              'pr-10 transition-colors', 
              error && 'border-destructive/50 bg-destructive/5 ring-destructive/20 focus-visible:ring-destructive',
              className
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {error && <p className="text-xs text-destructive font-medium">{error}</p>}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
