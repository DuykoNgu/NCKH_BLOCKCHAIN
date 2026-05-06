import { z } from "zod";

// Schema cho việc tạo ví cá nhân
export const createWalletSchema = z.object({
  password: z.string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .regex(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
    .regex(/[0-9]/, "Mật khẩu phải có ít nhất 1 chữ số"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

// Schema cho việc đăng ký trường học (kế thừa từ createWalletSchema)
export const schoolRegisterSchema = createWalletSchema.extend({
  schoolName: z.string().min(5, "Tên trường phải từ 5 ký tự trở lên"),
  taxId: z.string().min(10, "Mã số thuế không hợp lệ"),
  representative: z.string().min(2, "Vui lòng nhập tên người đại diện"),
  email: z.string().email("Email không đúng định dạng"),
  phone: z.string().min(10, "Số điện thoại phải từ 10 số"),
});

export type CreateWalletValues = z.infer<typeof createWalletSchema>;
export type SchoolRegisterValues = z.infer<typeof schoolRegisterSchema>;
