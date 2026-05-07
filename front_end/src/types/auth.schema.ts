import { z } from "zod";

// Base fields for wallet creation
const baseWalletSchema = z.object({
  fullName: z.string().min(2, "Họ và tên phải từ 2 ký tự trở lên"),
  email: z.string().email("Email không đúng định dạng"),
  password: z.string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .regex(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
    .regex(/[0-9]/, "Mật khẩu phải có ít nhất 1 chữ số"),
  confirmPassword: z.string()
});

// Schema cho việc tạo ví cá nhân (có thêm xác nhận mật khẩu)
export const createWalletSchema = baseWalletSchema.refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

// Schema cho việc đăng ký trường học (kế thừa từ baseWalletSchema)
export const schoolRegisterSchema = baseWalletSchema.safeExtend({
  schoolName: z.string().min(5, "Tên trường phải từ 5 ký tự trở lên"),
  taxId: z.string().min(10, "Mã số thuế không hợp lệ"),
  representative: z.string().min(2, "Vui lòng nhập tên người đại diện"),
  phone: z.string().min(10, "Số điện thoại phải từ 10 số"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

export type CreateWalletValues = z.infer<typeof createWalletSchema>;
export type SchoolRegisterValues = z.infer<typeof schoolRegisterSchema>;
