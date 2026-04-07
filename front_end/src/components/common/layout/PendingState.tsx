import { motion } from "framer-motion";
import { ShieldAlert, Fingerprint, Clock, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const PendingState = ({ onLogout }: { onLogout?: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full flex flex-col items-center justify-center min-h-[60vh] text-center p-6"
    >
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-yellow-500/20 blur-[50px] rounded-full" />
        <div className="relative bg-gradient-to-br from-yellow-500/20 to-amber-600/10 p-6 rounded-3xl border border-yellow-500/30 backdrop-blur-xl shadow-2xl">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute -top-4 -right-4 bg-background border border-border rounded-full p-2 text-yellow-500 shadow-xl"
          >
            <Clock className="w-5 h-5" />
          </motion.div>
          
          <ShieldAlert className="w-20 h-20 text-yellow-500 mx-auto" strokeWidth={1.5} />
        </div>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="max-w-xl space-y-6"
      >
        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          Đang Chờ Phê Duyệt
        </h2>
        
        <p className="text-lg text-muted-foreground leading-relaxed px-4">
          Tài khoản Tổ chức/Trường học của bạn đang được <strong className="text-foreground">Bộ Giáo Dục và Đào Tạo (MOET)</strong> thẩm định danh tính. Quá trình kiểm tra KYC là bắt buộc trên Blockchain EduChain để đảm bảo tính xác thực của Chứng chỉ.
        </p>

        <div className="grid grid-cols-2 gap-4 mt-8 pb-4">
          <div className="glass-card p-4 rounded-2xl flex flex-col items-center text-center">
            <Building2 className="w-6 h-6 text-primary mb-2" />
            <h4 className="text-sm font-semibold mb-1">Xác minh Pháp nhân</h4>
            <p className="text-xs text-muted-foreground">MOET đối chiếu hồ sơ hệ thống</p>
          </div>
          <div className="glass-card p-4 rounded-2xl flex flex-col items-center text-center">
            <Fingerprint className="w-6 h-6 text-purple-500 mb-2" />
            <h4 className="text-sm font-semibold mb-1">Cấp quyền Multi-Sig</h4>
            <p className="text-xs text-muted-foreground">Thiết lập chữ ký số ECDSA</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-6">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => window.location.reload()}
            className="border-yellow-500/30 hover:bg-yellow-500/10 hover:text-yellow-600 rounded-full px-8"
          >
            Tải lại phần quyền
          </Button>

          {onLogout && (
            <Button 
              variant="ghost" 
              size="lg" 
              onClick={onLogout}
              className="text-muted-foreground hover:text-foreground rounded-full px-8"
            >
              Đăng xuất
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
