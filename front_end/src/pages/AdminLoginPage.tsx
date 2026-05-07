import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck, KeyRound, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminLoginWithPrivateKey } from '@/services/authService';
import { toast } from 'sonner';

const loginSchema = z.object({
  privateKey: z.string()
    .min(1, "Vui lòng nhập Private Key")
    .length(64, "Private Key phải có độ dài đúng 64 ký tự hex")
    .regex(/^[0-9a-fA-F]+$/, "Private Key chỉ chứa ký tự hex (0-9, a-f)")
});

type LoginFormValues = z.infer<typeof loginSchema>;

const AdminLoginPage = () => {
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange"
  });

  const loginMutation = useMutation({
    mutationFn: (values: LoginFormValues) => adminLoginWithPrivateKey(values.privateKey),
    onSuccess: () => {
      navigate('/admin');
      toast.success('Đăng nhập Admin thành công');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Đăng nhập thất bại. Private Key không hợp lệ.');
    }
  });

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background decorations matching the theme */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="glass-card rounded-2xl p-10 shadow-[0_8px_40px_-12px_hsla(0,0%,0%,0.08)]">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg mb-6">
              <ShieldCheck className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground text-center">
              MOET Admin Portal
            </h1>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Hệ thống quản trị CSDL Bằng cấp Quốc gia
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {loginMutation.isError && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="text-sm text-destructive font-medium">
                  {(loginMutation.error as any)?.message || "Đăng nhập thất bại"}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Admin Private Key
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  {...register("privateKey")}
                  type="password"
                  placeholder="Nhập Private Key (Hex format)..."
                  className={`pl-10 h-12 bg-secondary/50 border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:bg-background transition-colors font-mono text-sm ${errors.privateKey ? 'border-destructive/50 ring-destructive/20' : ''}`}
                />
              </div>
              {errors.privateKey && (
                <p className="text-[10px] text-destructive font-bold uppercase tracking-tight ml-1 animate-in fade-in slide-in-from-top-1">
                  {errors.privateKey.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending || !isValid}
              className="w-full h-12 rounded-xl font-display font-semibold transition-all group"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Đang xác thực...
                </>
              ) : (
                <>
                  Truy cập Hệ thống
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              &larr; Quay lại trang đăng nhập người dùng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
