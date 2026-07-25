import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Shield, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "../utils/api";
import useAuthStore from "../store/authStore";
import Button from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";

function LoginPage() {
  const [step, setStep] = useState("login");
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "patient",
  });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.login(form);
      setStep("otp");
      toast.success("Verification code sent to your email");
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
          "We couldn't sign you in. Check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
    if (newOtp.every((d) => d) && index === 5) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleOtpPaste = (e) => {
    const data = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (data.length === 6) {
      setOtp(data.split(""));
      handleVerify(data);
    }
  };

  const handleVerify = async (otpValue) => {
    const code = otpValue || otp.join("");
    if (code.length !== 6) return;
    setLoading(true);
    try {
      const { data } = await authAPI.verifyMfa({
        email: form.email,
        otp: code,
        role: form.role,
      });
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success(`Welcome back, ${data.user.name}`);
      navigate(`/${form.role}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Invalid verification code");
      setOtp(["", "", "", "", "", ""]);
      document.getElementById("otp-0")?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top nav */}
      <nav className="bg-primary-900 text-white">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link
              to="/"
              className="flex items-center gap-2 text-lg sm:text-xl font-bold tracking-tight"
            >
              <span className="w-7 h-7 bg-primary-500 rounded flex items-center justify-center text-white text-xs font-bold">
                MT
              </span>
              MedTrace
            </Link>
            <Link
              to="/"
              className="text-sm text-slate-200 hover:text-white transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center pt-10 sm:pt-16 px-4 pb-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-xl sm:text-2xl font-bold text-primary-900">
              {step === "login"
                ? "Sign in to your account"
                : "Enter verification code"}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {step === "login"
                ? "Choose your role and enter your credentials"
                : `A 6-digit code was sent to ${form.email}`}
            </p>
          </div>

          <div className="card">
            {step === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <Select
                  label="Role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Hospital Admin</option>
                </Select>
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                />
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  loading={loading}
                >
                  Sign In
                </Button>
              </form>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVerify();
                }}
                className="space-y-6"
              >
                <div>
                  <p className="text-xs text-slate-400 mb-4 text-center">
                    Enter the 6-digit code sent to{" "}
                    <strong className="text-ink">{form.email}</strong>
                  </p>
                  <div
                    className="flex gap-2 justify-center"
                    onPaste={handleOtpPaste}
                  >
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-mono font-bold border border-slate-200 rounded-input bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        autoFocus={i === 0}
                        required
                      />
                    ))}
                  </div>
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  loading={loading}
                >
                  Verify & Sign In
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("login");
                    setOtp(["", "", "", "", "", ""]);
                  }}
                  className="w-full text-center text-sm text-primary-500 hover:underline inline-flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" /> Use a different email
                </button>
              </form>
            )}
          </div>

          <div className="mt-6 text-center space-y-2">
            <p className="text-xs text-slate-400">
              Don't have an account?{" "}
              <Link
                to="/register/patient"
                className="text-primary-500 hover:underline font-medium"
              >
                Register as Patient
              </Link>
            </p>
            <p className="text-xs text-slate-400">
              <Link
                to="/register/doctor"
                className="text-primary-500 hover:underline font-medium"
              >
                Register as Doctor
              </Link>
              {" · "}
              <Link
                to="/register/hospital"
                className="text-primary-500 hover:underline font-medium"
              >
                Register Hospital
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
