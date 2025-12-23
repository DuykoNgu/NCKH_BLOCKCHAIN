import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createWallet } from '@/services/authService';
import { validatePassword, validateForm } from "@/ultis/validators/formValidator";
import type { FormFields } from "@/types/auth";
import InputField from '@/components/common/InputField';

type FieldName = keyof FormFields;

export default function CreateWalletForm() {
  const [form, setForm] = useState<FormFields>({password: '', confirmPassword: ''});
  const [errors, setErrors] = useState({ passwordError: '', confirmPasswordError: ''});
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const navigate = useNavigate();

  const updateField = (field: FieldName, value: string) => {
    setForm(p => ({ ...p, [field]: value }));
    if (field === 'password' && (value.length > 0 || hasSubmitted)) {
      const { isValid, message } = validatePassword(value);
      setErrors(p => ({ ...p, passwordError: isValid ? '' : message }));
    } else if (field === 'confirmPassword' && (value.length > 0 || hasSubmitted)) {
      setErrors(p => ({ ...p, confirmPasswordError: value !== form.password ? 'Passwords do not match' : '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateForm(form.password, form.confirmPassword);
    setHasSubmitted(true);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    setLoading(true);
    try {
      await createWallet(form.password);
      navigate("/login/existing");
    } catch {
      alert('Failed to create wallet');
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <form onSubmit={handleSubmit} className="flex flex-col items-center w-full">
        <InputField type="password" label="Password" value={form.password} onChange={(value) => updateField('password', value)} error={errors.passwordError} />
        <InputField type="password" label="Confirm Password" value={form.confirmPassword} onChange={(value) => updateField('confirmPassword', value)} error={errors.confirmPasswordError} />
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-10 py-3 rounded-xl text-lg font-semibold w-[400px] disabled:opacity-50 hover:scale-105 active:scale-95"
        >
          {loading ? 'Creating...' : 'Create Wallet'}
        </button>
      </form>
      <button
        onClick={() => navigate('/login')}
        className="mt-4 bg-gray-600 text-white px-10 py-3 rounded-xl text-lg font-semibold w-[400px] hover:scale-105 active:scale-95"
      >
        Back
      </button>
    </div>
  );
}