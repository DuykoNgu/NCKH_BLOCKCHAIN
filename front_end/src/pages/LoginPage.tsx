import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SingInForm from "@/components/common/loginpage_common/SignInForm";
import SignUpForm from "@/components/common/loginpage_common/SignUpForm";
import OverlayPanelLogin from "@/components/common/loginpage_common/OverlayPanelLogin";
import "../style/Login.css";

const LoginPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (location.pathname === "/signup") {
      setIsActive(true);
    } else {
      setIsActive(false);
    }
  }, [location.pathname]);

  // const [isActive, setIsActive]
  // const [email, setEmail] = useState('');
  // const [password, setPassword] = useState('');
  // const navigate = useNavigate();

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   console.log('Login attempt:', { email, password });
  //   localStorage.setItem('isLoggedIn', 'true');
  //   navigate('/');
  // };

  return (
    <div className="login-page-wrapper">
      <div className={`container ${isActive ? "active" : ""}`} id="container">
        <SingInForm />
        <SignUpForm />
        <OverlayPanelLogin
          onLogin={() => {
            setIsActive(false);
            navigate('/signin');
          }}
          onRegister={() => {
            setIsActive(true);
            navigate('/signup');
          }}
        />
      </div>
    </div>
  );
};

export default LoginPage;
