import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Shield, Coins, AlertCircle, Loader2 } from 'lucide-react';
import { useRadixToast } from "@/hooks/use-radix-toast";

export const WalletRegister = () => {
  const {showToast} = useRadixToast();

  const [validatorName, setValidatorName] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const minStake = 32; // Minimum stake amount
  const balance = 0; // Placeholder for balance, replace with actual value

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Basic validation
    if (!validatorName.trim()) {
      setError('Tên validator là bắt buộc');
      setIsSubmitting(false);
      return;
    }

    // Simulate registration process
    try {
      // Replace with actual registration logic
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      showToast({
        title: "Thành công",
        description: "Đăng ký validator thành công!",
      });
    } catch (err) {
      setError('Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl from-accent to-primary flex items-center justify-center">
          <Shield className="w-5 h-5 text-amber-200" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Đăng ký Validator</h3>
        </div>
      </div>

      {/* Requirements Info */}
      <div className="bg-secondary/50 rounded-xl p-4 mb-6">
        <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
          <Coins className="w-4 h-4 text-accent" />
          Yêu cầu
        </h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Trường nằm trên khu vực Việt Nam</li>
          <li>• Mức độ uy tin theo</li>
          <li>• Commission rate: 0-100%</li>
        </ul>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="validatorName" className="text-foreground">Tên Validator</Label>
          <Input
            id="validatorName"
            placeholder="Nhập tên validator của bạn"
            value={validatorName}
            onChange={(e) => setValidatorName(e.target.value)}
            className="bg-secondary/50 border-border focus:border-accent"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stakeAmount" className="text-foreground">Số lượng ETH Stake</Label>
          <div className="relative">
            <Input
              id="stakeAmount"
              type="number"
              placeholder={`Tối thiểu ${minStake} ETH`}
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              min={minStake}
              step="0.01"
              className="bg-secondary/50 border-border focus:border-accent pr-14"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              ETH
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="commission" className="text-foreground">Tỷ lệ Commission (%)</Label>
          <div className="relative">
            <Input
              id="commission"
              type="number"
              placeholder="5"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              min="0"
              max="100"
              step="0.1"
              className="bg-secondary/50 border-border focus:border-accent pr-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              %
            </span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full from-accent to-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 mr-2" />
              Đăng ký Validator
            </>
          )}
        </Button>
      </form>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Bằng việc đăng ký, bạn đồng ý với các điều khoản và điều kiện của mạng lưới
      </p>
    </div>
  );
};


