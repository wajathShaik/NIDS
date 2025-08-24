import React, { useMemo } from 'react';

interface PasswordStrengthMeterProps {
  password?: string;
}

interface Strength {
  label: string;
  color: string;
  width: string;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password = '' }) => {
  const strength: Strength = useMemo(() => {
    let score = 0;
    if (!password) return { label: '', color: 'bg-gray-700', width: '0%' };

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    switch (score) {
      case 0:
      case 1:
      case 2:
        return { label: 'Weak', color: 'bg-red-500', width: '25%' };
      case 3:
      case 4:
        return { label: 'Medium', color: 'bg-yellow-500', width: '50%' };
      case 5:
        return { label: 'Strong', color: 'bg-green-500', width: '75%' };
      case 6:
        return { label: 'Very Strong', color: 'bg-emerald-500', width: '100%' };
      default:
        return { label: '', color: 'bg-gray-700', width: '0%' };
    }
  }, [password]);

  const criteria = [
      { label: '8+ characters', fulfilled: password.length >= 8 },
      { label: '1 uppercase', fulfilled: /[A-Z]/.test(password) },
      { label: '1 lowercase', fulfilled: /[a-z]/.test(password) },
      { label: '1 number', fulfilled: /\d/.test(password) },
      { label: '1 special char', fulfilled: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password) }
  ];

  if (!password) {
      return null;
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${strength.color}`}
          style={{ width: strength.width }}
        />
      </div>
      <p className={`text-xs font-medium ${
          strength.label === 'Weak' ? 'text-red-400' : 
          strength.label === 'Medium' ? 'text-yellow-400' :
          strength.label === 'Strong' ? 'text-green-400' : 'text-emerald-400'
      }`}>Password strength: {strength.label}</p>
      
      <ul className="text-xs text-gray-400 grid grid-cols-2 gap-x-4">
        {criteria.map(c => (
             <li key={c.label} className={`flex items-center transition-colors ${c.fulfilled ? 'text-green-400' : 'text-gray-500'}`}>
                <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d={c.fulfilled ? "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" : "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"} clipRule="evenodd"></path>
                </svg>
                {c.label}
             </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordStrengthMeter;
