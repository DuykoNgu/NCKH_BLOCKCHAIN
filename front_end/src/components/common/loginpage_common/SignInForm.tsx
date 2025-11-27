import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { postLogin } from "@/services/authService";
import type { LoginData } from "@/types/auth";
import "@/style/Login.css";

const SingInForm = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginData>();

  const onSubmit = async (data: LoginData) => {
    // Mock để chờ api
    if (data.email === "test@test.com" && data.password === "123456") {
      localStorage.setItem("access_token", "mock_token");
      localStorage.setItem("isLoggedIn", "true");
      navigate("/");
      return;
    }

    try {
      const response = await postLogin(data);
      localStorage.setItem("access_token", response.access_token);
      localStorage.setItem("isLoggedIn", "true");
      navigate("/");
    } catch (err: any) {
      setError("root", { message: err.response?.data?.message || "Đăng nhập thất bại" });
    }
  };

  return (
    <div className="form-container sign-in">
      <form onSubmit={handleSubmit(onSubmit)}>
        <h1>Đăng Nhập</h1>
        <span>hoặc sử dụng email và mật khẩu của bạn</span>
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
        <a href="#">Quên Mật Khẩu?</a>
        {errors.root && <p style={{ color: 'red' }}>{errors.root.message}</p>}
        <button type="submit">Đăng Nhập</button>
      </form>
    </div>
  );
};

export default SingInForm;
