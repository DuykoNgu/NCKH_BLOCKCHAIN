import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postWalletRegister } from '@/services/authService';
import { encryptPrivateKey } from '@/ultis/cryptoVault';
import type { UserRole } from '@/types/auth';
import { validatePassword, validateForm } from "@/ultis/validators/formValidator";
import type { FormFields } from "@/types/auth";
import InputField from '@/components/common/InputField';
import SelectField from '@/components/common/SelectField';
import secp from "@configs/secp256k1.config";

type FieldName = keyof FormFields;
const toHex = (arr: Uint8Array) => Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');

export default function CreateWalletForm() {
  const [form, setForm] = useState<FormFields>({password: '', confirmPassword: '', role: 'user' as UserRole});
  const [errors, setErrors] = useState({ passwordError: '', confirmPasswordError: '', roleError: '' });
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
    } else if (field === 'role' && hasSubmitted) {
      setErrors(p => ({ ...p, roleError: value ? '' : 'Please select a role' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateForm(form.password, form.confirmPassword, form.role);
    setHasSubmitted(true);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    setLoading(true);
    try {
      const privateKey = secp.utils.randomSecretKey();
      const publicKey = secp.getPublicKey(privateKey);
      const addressHash = await crypto.subtle.digest("SHA-256", publicKey as any);
      const address = toHex(new Uint8Array(addressHash)).slice(0, 40);

      const { encrypted, iv } = await encryptPrivateKey(privateKey, form.password);
      localStorage.setItem("vault", JSON.stringify({ encrypted: toHex(encrypted), iv: toHex(iv) }));
      localStorage.setItem("public_key", toHex(publicKey));
      localStorage.setItem("address", "0x" + address);

      await postWalletRegister({ public_key: toHex(publicKey), address: "0x" + address, role: form.role });
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

        <SelectField value={form.role} onChange={(value) => updateField('role', value)} error={errors.roleError} options={[{value: 'admin', label: 'Admin'}, {value: 'user', label: 'User'}, {value: 'Validator', label: 'Validator'}]} />
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