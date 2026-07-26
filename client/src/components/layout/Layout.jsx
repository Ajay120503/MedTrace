import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  LogOut,
  Moon,
  Sun,
  User,
  Stethoscope,
  Shield,
} from "lucide-react";
import useAuthStore from "../../store/authStore";

function Layout({ children, role }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light"
    );
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleIcons = { patient: User, doctor: Stethoscope, admin: Shield };

  const navLinks = {
    patient: [{ to: "/patient", label: "Dashboard" }],
    doctor: [
      { to: "/doctor", label: "Dashboard" },
      { to: "/doctor/access", label: "Access Patient" },
      { to: "/doctor/emergency", label: "Emergency Access" },
    ],
    admin: [
      { to: "/admin", label: "Dashboard" },
      { to: "/admin/audit", label: "Audit Log" },
    ],
  };

  const RoleIcon = roleIcons[role] || User;

  return (
    <div className="min-h-screen bg-bg">
      <nav className="bg-primary-900/95 text-white sticky top-0 z-40 shadow-sm backdrop-blur">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-6">
              <Link
                to="/"
                className="text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2"
              >
                <span className="w-7 h-7 bg-primary-500 rounded flex items-center justify-center text-xs font-bold">
                  MT
                </span>
                MedTrace
              </Link>
              <div className="hidden md:flex items-center gap-1 rounded-button bg-white/5 p-1">
                {(navLinks[role] || []).map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-3 py-1.5 rounded-button text-sm font-medium transition-colors ${
                      location.pathname === link.to
                        ? "bg-white text-primary-900 shadow-sm"
                        : "text-slate-200 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-button text-slate-200 hover:text-white hover:bg-primary-700 transition-colors"
                aria-label={
                  darkMode ? "Switch to light mode" : "Switch to dark mode"
                }
              >
                {darkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
              <div className="hidden sm:flex items-center space-x-3">
                <div className="flex items-center gap-2 rounded-button border border-white/10 bg-white/5 px-2 py-1">
                  <div className="w-7 h-7 rounded-full bg-success-500 flex items-center justify-center">
                    <RoleIcon className="h-3.5 w-3.5" />
                  </div>
                  <span className="max-w-32 truncate text-sm text-white">
                    {user?.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm text-slate-200 hover:text-white px-2 py-1 rounded-button hover:bg-primary-700 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </div>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-button text-slate-200 hover:text-white hover:bg-primary-700"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-primary-700">
            <div className="px-4 py-3 space-y-1">
              {(navLinks[role] || []).map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-button text-sm font-medium ${
                    location.pathname === link.to
                      ? "bg-primary-700 text-white"
                      : "text-slate-200 hover:text-white hover:bg-primary-700"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <hr className="border-primary-700 my-2" />
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-200">
                <RoleIcon className="h-4 w-4" />
                {user?.name}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-200 hover:text-white hover:bg-primary-700 rounded-button"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          </div>
        )}
      </nav>
      <main className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}

export default Layout;
