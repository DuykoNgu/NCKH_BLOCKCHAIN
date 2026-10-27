export const validatePassword = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }

  if (!/^[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must start with a capital letter' };
  }

  if (!/\d/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character' };
  }

  return { isValid: true, message: 'Password is valid' };
};

export interface FormValidationErrors {
  passwordError: string;
  confirmPasswordError: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: FormValidationErrors;
}

export const validateForm = (
  password: string,
  confirmPassword: string,
): FormValidationResult => {
  const errors: FormValidationErrors = {
    passwordError: '',
    confirmPasswordError: '',
  };

  let isValid = true;

  const isEmptyForm = !password && !confirmPassword;

  if (isEmptyForm) {
    if (!password) {
      errors.passwordError = 'This field is required';
      isValid = false;
    }
    if (!confirmPassword) {
      errors.confirmPasswordError = 'This field is required';
      isValid = false;
    }
  } else {
    if (password) {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        errors.passwordError = passwordValidation.message;
        isValid = false;
      }
    }

    if (confirmPassword) {
      if (password !== confirmPassword) {
        errors.confirmPasswordError = 'Passwords do not match';
        isValid = false;
      }
    }

  }

  return { isValid, errors };
};
