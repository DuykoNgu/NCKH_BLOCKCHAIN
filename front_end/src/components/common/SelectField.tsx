import React from 'react';

interface SelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  options: { value: string; label: string }[];
}

const SelectField: React.FC<SelectFieldProps> = ({ value, onChange, error, options }) => (
  <div className="w-[400px] mb-4">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-4 py-2 rounded-xl text-black border ${error ? 'border-red-500' : 'border-gray-300'}`}
      required
    >
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
    {error && <p className="text-red-400 text-sm mt-1 font-medium">{error}</p>}
  </div>
);

export default SelectField;