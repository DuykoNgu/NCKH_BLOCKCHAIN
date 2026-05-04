/**
 * Hook để quản lý password trong session storage
 * Password sẽ tự động xóa khi đóng tab/trình duyệt
 */

const PASSWORD_KEY = '__wallet_pwd';

/**
 * Lưu password vào session storage
 * @param password - Mật khẩu ví
 */
export const savePasswordToSession = (password: string): void => {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(PASSWORD_KEY, password);
    console.log('[PasswordStorage] Password saved to session storage');
  }
};

/**
 * Lấy password từ session storage
 * @returns Password hoặc null nếu không tìm thấy
 */
export const getPasswordFromSession = (): string | null => {
  if (typeof sessionStorage !== 'undefined') {
    return sessionStorage.getItem(PASSWORD_KEY);
  }
  return null;
};

/**
 * Xóa password khỏi session storage
 */
export const clearPasswordFromSession = (): void => {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(PASSWORD_KEY);
    console.log('[PasswordStorage] Password cleared from session storage');
  }
};

/**
 * Kiểm tra xem password đã được lưu hay chưa
 * @returns true nếu password đã lưu
 */
export const isPasswordSaved = (): boolean => {
  if (typeof sessionStorage !== 'undefined') {
    return sessionStorage.getItem(PASSWORD_KEY) !== null;
  }
  return false;
};

/**
 * Hook React để sử dụng password từ session storage
 */
export const usePassword = () => {
  const savePassword = (password: string) => {
    savePasswordToSession(password);
  };

  const getPassword = () => {
    return getPasswordFromSession();
  };

  const clearPassword = () => {
    clearPasswordFromSession();
  };

  const hasPassword = () => {
    return isPasswordSaved();
  };

  return {
    savePassword,
    getPassword,
    clearPassword,
    hasPassword,
  };
};
