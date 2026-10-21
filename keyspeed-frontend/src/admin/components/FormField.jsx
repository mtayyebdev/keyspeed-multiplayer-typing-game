import React from 'react';

export default function FormField({
  label,
  required,
  error,
  helperText,
  children,
  className = '',
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-fg/80 flex items-center gap-1">
          <span>{label}</span>
          {required && <span className="text-danger font-bold">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-danger font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-fg/50">{helperText}</p>
      ) : null}
    </div>
  );
}

