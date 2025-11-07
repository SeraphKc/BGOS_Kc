import React from 'react';

interface ToggleProps {
  isOn: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
}

const Toggle: React.FC<ToggleProps> = ({ 
  isOn, 
  onToggle, 
  disabled = false, 
  className = '' 
}) => {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`
        relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
        ${isOn ? 'bg-gray-600' : 'bg-gray-600'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      style={{ backgroundColor: '#404040' }}
    >
      <span
        className={`
          inline-block h-5 w-5 transform rounded-full bg-primary transition-transform duration-200 ease-in-out
          ${isOn ? 'translate-x-6' : 'translate-x-1'}
        `}
        style={{ backgroundColor: '#ffd900' }}
      />
    </button>
  );
};

export default Toggle; 