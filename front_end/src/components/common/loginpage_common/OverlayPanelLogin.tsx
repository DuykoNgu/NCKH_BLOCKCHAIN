import React from "react";
import "@/style/Login.css";

interface Props {
  onLogin: () => void;
  onRegister: () => void;
}

const OverlayPanelLogin: React.FC<Props> = ({ onLogin, onRegister }) => (
  <div className="toggle-container">
    <div className="toggle">
      <div className="toggle-panel toggle-left">
        <h1>Welcome Back!</h1>
        <p>Enter your personal details to use all of site features</p>
        <button className="hidden" onClick={onLogin} id="login">
          Sign In
        </button>
      </div>
      <div className="toggle-panel toggle-right">
        <h1>Hello, Friend!</h1>
        <p>Register with your personal details to use all of site features</p>
        <button className="hidden" onClick={onRegister} id="register">
          Sign Up
        </button>
      </div>
    </div>
  </div>
);

export default OverlayPanelLogin;