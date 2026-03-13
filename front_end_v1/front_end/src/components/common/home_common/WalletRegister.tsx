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
    <div className="glass-card rounded-2xl p-4 sm:p-6 animate-fade-in">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl from-accent to-primary flex items-center justify-center">
          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-sm sm:text-base">Đăng ký Validator</h3>
        </div>
      </div>

      {/* Requirements Info */}
      <div className="bg-secondary/50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
        <h4 className="font-medium text-foreground mb-2 flex items-center gap-2 text-sm sm:text-base">
          <Coins className="w-4 h-4 text-accent" />
          Yêu cầu
        </h4>
        <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
          <li>• Trường nằm trên khu vực Việt Nam</li>
          <li>• Mức độ uy tin theo rank trên 50 điểm</li>
        </ul>
      </div>

      <form onSubmit={handleRegister} className="space-y-3 sm:space-y-4">
        <div className="space-y-2">
          <Label htmlFor="validatorName" className="text-foreground text-sm sm:text-base">Tên Validator</Label>
          <Input
            id="validatorName"
            placeholder="Nhập tên validator của bạn"
            value={validatorName}
            onChange={(e) => setValidatorName(e.target.value)}
            className="bg-secondary/50 border-border focus:border-accent text-sm sm:text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stakeAmount" className="text-foreground text-sm sm:text-base">Số lượng ETH Stake</Label>
          <div className="relative">
            <Input
              id="stakeAmount"
              type="number"
              placeholder={`Tối thiểu ${minStake} ETH`}
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              min={minStake}
              step="0.01"
              className="bg-secondary/50 border-border focus:border-accent pr-12 sm:pr-14 text-sm sm:text-base"
            />
            <span className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs sm:text-sm">
              ETH
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="commission" className="text-foreground text-sm sm:text-base">Tỷ lệ Commission (%)</Label>
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
              className="bg-secondary/50 border-border focus:border-accent pr-8 sm:pr-10 text-sm sm:text-base"
            />
            <span className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs sm:text-sm">
              %
            </span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-destructive text-xs sm:text-sm bg-destructive/10 rounded-lg p-2 sm:p-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full from-accent to-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity text-sm sm:text-base"
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

      <p className="text-xs sm:text-sm text-muted-foreground text-center mt-3 sm:mt-4">
        Bằng việc đăng ký, bạn đồng ý với các điều khoản và điều kiện của mạng lưới
      </p>
    </div>
  );
};


