import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function Input({ label, error, type, className = "", ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-ink">{label}</label>
      )}
      <div className="relative">
        <input
          type={isPassword && showPassword ? "text" : type}
          className={`w-full px-4 py-2.5 border rounded-input bg-surface text-ink placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors text-sm ${
            error
              ? "border-emergency-500 focus:ring-emergency-500"
              : "border-slate-200 focus:ring-primary-500"
          } ${isPassword ? "pr-10" : ""} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-emergency-500">{error}</p>}
    </div>
  );
}

function Select({ label, error, children, className = "", ...props }) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-ink">{label}</label>
      )}
      <select
        className={`w-full px-4 py-2.5 border rounded-input bg-surface text-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-sm ${
          error ? "border-emergency-500" : "border-slate-200"
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-emergency-500">{error}</p>}
    </div>
  );
}

export { Input, Select };
