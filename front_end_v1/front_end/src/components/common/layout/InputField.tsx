import React from 'react';

interface InputFieldProps {
  type?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const InputField: React.FC<InputFieldProps> = ({ type = 'text', label, value, onChange, error }) => (
  <div className="w-[400px] mb-4">
    <input
      type={type}
      placeholder={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-4 py-2 rounded-xl text-black border ${error ? 'border-red-500' : 'border-gray-300'}`}
      required
    />
    {error && <p className="text-red-400 text-sm mt-1 font-medium">{error}</p>}
  </div>
);

export default InputField;