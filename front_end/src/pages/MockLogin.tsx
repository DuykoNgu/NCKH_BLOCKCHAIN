// MOCK FILE - Dùng cho mục đích test giao diện, xóa trước khi deploy production
import { useNavigate } from "react-router-dom";

const MockLogin = () => {
  const navigate = useNavigate();

  const loginAsAdmin = () => {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("role", "admin");
    localStorage.setItem("full_name", "Admin User");
    localStorage.setItem("address", "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b");
    navigate("/admin");
  };

  const loginAsClient = () => {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("role", "client");
    localStorage.setItem("full_name", "Client User");
    localStorage.setItem("address", "0xabcdef1234567890abcdef1234567890abcdef12");
    navigate("/home");
  };

  const clearLogin = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("role");
    localStorage.removeItem("full_name");
    localStorage.removeItem("address");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="glass-card rounded-2xl p-10 max-w-md w-full mx-4 space-y-6">
        <h1 className="font-display text-2xl font-bold text-foreground text-center">
          Mock Login (Dev)
        </h1>
        <p className="text-sm text-muted-foreground text-center">
          Chọn role để đăng nhập thử
        </p>
        <div className="space-y-3">
          <button
            onClick={loginAsAdmin}
            className="w-full bg-primary text-primary-foreground font-medium py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
          >
            Đăng nhập với role Admin
          </button>
          <button
            onClick={loginAsClient}
            className="w-full border border-foreground text-foreground font-medium py-3 px-6 rounded-lg hover:bg-secondary transition-colors"
          >
            Đăng nhập với role Client
          </button>
          <button
            onClick={clearLogin}
            className="w-full text-destructive font-medium py-2 px-6 rounded-lg hover:bg-destructive/10 transition-colors text-sm"
          >
            Xóa session
          </button>
        </div>
      </div>
    </div>
  );
};

export default MockLogin;
