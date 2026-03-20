import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Shield, Award, AlertCircle, Loader2, Activity } from 'lucide-react';
import { useRadixToast } from "@/hooks/use-radix-toast";

export const WalletRegister = () => {
  const {showToast} = useRadixToast();

  const [isExpanded, setIsExpanded] = useState(false);
  const [validatorName, setValidatorName] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Basic validation
    if (!validatorName.trim()) {
      setError('Tên đơn vị là bắt buộc');
      setIsSubmitting(false);
      return;
    }

    // Simulate registration process
    try {
      // Replace with actual registration logic
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      showToast({
        title: "Thành công",
        description: "Đăng ký thành công! Vui lòng chờ phê duyệt.",
      });
      setIsExpanded(false);
    } catch (err) {
      setError('Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isExpanded) {
    return (
      <div className="glass-card rounded-2xl p-6 flex flex-col items-center text-center space-y-3 animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Shield className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground">Dành cho Tổ chức</h3>
          <p className="text-xs text-muted-foreground px-4">
            Bạn là cơ sở giáo dục muốn tham gia mạng lưới kiểm định?
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setIsExpanded(true)}
          className="w-full border-primary/20 hover:bg-primary/5 text-primary text-sm"
        >
          Trở thành Nhà kiểm định
        </Button>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary flex items-center justify-center">
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <h3 className="font-semibold text-foreground text-sm sm:text-base">Trở thành Nhà kiểm định bằng cấp</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)} className="text-muted-foreground h-8 px-2">
          Hủy
        </Button>
      </div>

      {/* Requirements Info */}
      <div className="bg-secondary/50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
        <h4 className="font-medium text-foreground mb-2 flex items-center gap-2 text-sm sm:text-base">
          <Activity className="w-4 h-4 text-primary" />
          Điều kiện tham gia
        </h4>
        <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
          <li>• Là cơ sở giáo dục được cấp phép tại Việt Nam</li>
          <li>• Có điểm uy tín hệ thống tối thiểu trên 50</li>
        </ul>
      </div>

      <form onSubmit={handleRegister} className="space-y-3 sm:space-y-4">
        <div className="space-y-2">
          <Label htmlFor="validatorName" className="text-foreground text-sm sm:text-base">Tên trường hoặc Tổ chức giáo dục</Label>
          <Input
            id="validatorName"
            placeholder="Ví dụ: Đại học Bách Khoa Hà Nội"
            value={validatorName}
            onChange={(e) => setValidatorName(e.target.value)}
            className="bg-secondary/50 border-border focus:border-accent text-sm sm:text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="commission" className="text-foreground text-sm sm:text-base">Hạn mức xác thực tối đa (%)</Label>
          <div className="relative">
            <Input
              id="commission"
              type="number"
              placeholder="100"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              min="0"
              max="100"
              step="1"
              className="bg-secondary/50 border-border focus:border-accent pr-8 sm:pr-10 text-sm sm:text-base"
            />
            <span className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs sm:text-sm">
              %
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">Tỷ lệ công việc bạn sẵn sàng tiếp nhận từ mạng lưới.</p>
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
          className="w-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity text-sm sm:text-base"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang gửi yêu cầu...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 mr-2" />
              Gửi yêu cầu gia nhập
            </>
          )}
        </Button>
      </form>

      <p className="text-xs sm:text-sm text-muted-foreground text-center mt-3 sm:mt-4">
        Gửi yêu cầu này đồng nghĩa với việc bạn chấp nhận các điều khoản của EduChain
      </p>
    </div>
  );
};


