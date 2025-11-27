import React from "react";
import "@/style/Login.css";
import logo from "@/assets/Logo_HAU.png";

interface Props {
  onLogin: () => void;
  onRegister: () => void;
}

const OverlayPanelLogin: React.FC<Props> = ({ onLogin, onRegister }) => (
  <div className="toggle-container">
    <div className="toggle">
      <div className="toggle-panel toggle-left">
        <img src={logo} alt="Logo" className="panel-logo" />
        <h1>Chào Mừng Trở Lại!</h1>
        <p>Nhập thông tin cá nhân của bạn để sử dụng tất cả các tính năng của trang web</p>
        <button className="hidden" onClick={onLogin} id="login">
          Đăng Nhập
        </button>
      </div>
      <div className="toggle-panel toggle-right">
        <img src={logo} alt="Logo" className="panel-logo" />
        <h1>Chào, Bạn!</h1>
        <p>Đăng ký với thông tin cá nhân của bạn để sử dụng tất cả các tính năng của trang web</p>
        <button className="hidden" onClick={onRegister} id="register">
          Đăng Ký
        </button>
      </div>
    </div>
  </div>
);

export default OverlayPanelLogin;