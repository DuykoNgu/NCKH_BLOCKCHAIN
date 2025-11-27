import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { postRegister } from "@/services/authService";
import type { RegisterData } from "@/types/auth";
import "@/style/Login.css";

const SignUpForm = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterData>();

  const onSubmit = async (data: RegisterData) => {
    try {
      await postRegister(data);
      // Assuming registration successful, redirect to signin
      navigate("/signin");
    } catch (err: any) {
      setError("root", { message: err.response?.data?.message || "Đăng ký thất bại" });
    }
  };

  return (
    <div className="form-container sign-up">
      <form onSubmit={handleSubmit(onSubmit)}>
        <h1>Tạo Tài Khoản</h1>
        {/* <SocialIcons /> */}
        <span>hoặc sử dụng email để đăng ký</span>
        <input
          type="text"
          placeholder="Tên"
          {...register("name", { required: true })}
          className={errors.name ? 'input-error' : ''}
        />
        <input
          type="email"
          placeholder="Email"
          {...register("email", { required: true })}
          className={errors.email ? 'input-error' : ''}
        />
        <input
          type="password"
          placeholder="Mật Khẩu"
          {...register("password", { required: true })}
          className={errors.password ? 'input-error' : ''}
        />
        <input
          type="date"
          placeholder="Ngày Sinh"
          {...register("dateOfBirth", { required: true })}
          className={errors.dateOfBirth ? 'input-error' : ''}
        />
        <select
          {...register("gender", { required: true })}
          className={errors.gender ? 'input-error' : ''}
        >
          <option value="">Chọn Giới Tính</option>
          <option value="Male">Nam</option>
          <option value="Female">Nữ</option>
          <option value="Other">Khác</option>
        </select>
        <input
          type="text"
          placeholder="Trường Đại Học"
          {...register("university", { required: true })}
          className={errors.university ? 'input-error' : ''}
        />
        <input
          type="text"
          placeholder="Quê Quán"
          {...register("hometown", { required: true })}
          className={errors.hometown ? 'input-error' : ''}
        />
        {errors.root && <p style={{ color: 'red' }}>{errors.root.message}</p>}
        <button type="submit">Đăng Ký</button>
      </form>
    </div>
  );
};

export default SignUpForm;
