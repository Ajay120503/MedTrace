import React from "react";

const variants = {
  primary:
    "bg-primary-500 text-white shadow-sm hover:bg-primary-700 hover:shadow-soft focus:ring-primary-500",
  secondary:
    "bg-surface text-primary-700 border border-primary-200 hover:bg-primary-100 hover:border-primary-500 focus:ring-primary-500",
  danger:
    "bg-emergency-500 text-white shadow-sm hover:bg-emergency-700 hover:shadow-soft focus:ring-emergency-500",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-ink focus:ring-slate-400",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2 text-sm",
  lg: "px-7 py-3 text-base",
};

function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  icon: Icon,
  className = "",
  disabled,
  ...props
}) {
  return (
    <button
      className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-button font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : Icon ? (
        <Icon className="h-4 w-4" />
      ) : null}
      {loading ? "Loading..." : children}
    </button>
  );
}

export default Button;
