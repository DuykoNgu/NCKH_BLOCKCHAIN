import type { UserRole } from '@/types/auth';

export const validatePassword = (password: string): { isValid: boolean; message: string } => {
  // Check minimum length (assuming at least 8 characters)
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }

  // Check if first character is uppercase letter
  if (!/^[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must start with a capital letter' };
  }

  // Check if contains at least one number
  if (!/\d/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }

  // Check if contains at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character' };
  }

  return { isValid: true, message: 'Password is valid' };
};

export interface FormValidationErrors {
  passwordError: string;
  confirmPasswordError: string;
  roleError: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: FormValidationErrors;
}

export const validateForm = (
  password: string,
  confirmPassword: string,
  role: UserRole
): FormValidationResult => {
  const errors: FormValidationErrors = {
    passwordError: '',
    confirmPasswordError: '',
    roleError: ''
  };

  let isValid = true;

  // Check if all fields are empty first
  const isEmptyForm = !password && !confirmPassword && !role;

  if (isEmptyForm) {
    // Show "This field is required" for all empty fields
    if (!password) {
      errors.passwordError = 'This field is required';
      isValid = false;
    }
    if (!confirmPassword) {
      errors.confirmPasswordError = 'This field is required';
      isValid = false;
    }
    if (!role) {
      errors.roleError = 'This field is required';
      isValid = false;
    }
  } else {
    // Validate password - only if not empty
    if (password) {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        errors.passwordError = passwordValidation.message;
        isValid = false;
      }
    }

    // Validate confirm password
    if (confirmPassword) {
      if (password !== confirmPassword) {
        errors.confirmPasswordError = 'Passwords do not match';
        isValid = false;
      }
    }

    // Validate role - only if not empty
    if (!role) {
      errors.roleError = 'Please select a role';
      isValid = false;
    }
  }

  return { isValid, errors };
};