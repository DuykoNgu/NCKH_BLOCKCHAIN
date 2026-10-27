
const PASSWORD_KEY = '__wallet_pwd';

export const savePasswordToSession = (password: string): void => {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(PASSWORD_KEY, password);
    console.log('[PasswordStorage] Password saved to session storage');
  }
};

export const getPasswordFromSession = (): string | null => {
  if (typeof sessionStorage !== 'undefined') {
    return sessionStorage.getItem(PASSWORD_KEY);
  }
  return null;
};

export const clearPasswordFromSession = (): void => {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(PASSWORD_KEY);
    console.log('[PasswordStorage] Password cleared from session storage');
  }
};

export const isPasswordSaved = (): boolean => {
  if (typeof sessionStorage !== 'undefined') {
    return sessionStorage.getItem(PASSWORD_KEY) !== null;
  }
  return false;
};

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
