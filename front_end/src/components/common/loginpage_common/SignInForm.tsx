import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { postLogin } from "@/services/authService";
import "@/style/Login.css";

const SingInForm = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Mock để chờ api
    if (email === "test@test.com" && password === "123456") {
      localStorage.setItem("access_token", "mock_token");
      localStorage.setItem("isLoggedIn", "true");
      navigate("/");
      return;
    }

    try {
      const response = await postLogin({ email, password });
      localStorage.setItem("access_token", response.access_token);
      localStorage.setItem("isLoggedIn", "true");
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="form-container sign-in">
      <form onSubmit={handleSubmit}>
        <h1>Sign In</h1>
        <span>or use your email password</span>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={error ? 'input-error' : ''}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={error ? 'input-error' : ''}
          required
        />
        <a href="#">Forgot Your Password?</a>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
};

export default SingInForm;
