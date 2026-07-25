import React from "react";

const variants = {
  pending: "bg-warning-100 text-warning-700",
  approved: "bg-success-100 text-success-700",
  active: "bg-success-100 text-success-700",
  rejected: "bg-emergency-100 text-emergency-700",
  expired: "bg-slate-100 text-slate-600",
  info: "bg-primary-100 text-primary-700",
  default: "bg-slate-100 text-slate-600",
};

function Badge({ children, variant = "default", className = "" }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        variants[variant] || variants.default
      } ${className}`}
    >
      {children}
    </span>
  );
}

export default Badge;
