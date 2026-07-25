import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Lock, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import Button from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";

function ForgotPassword() {
  const [step, setStep] = useState("request");
  const [form, setForm] = useState({
    email: "",
    role: "patient",
    newPassword: "",
    otp: "",
  });
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("/api/users/forgot-password", {
        email: form.email,
        role: form.role,
      });
      setStep("reset");
      toast.success("Reset OTP sent to your email");
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not send reset OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (form.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await axios.post("/api/users/reset-password", {
        email: form.email,
        role: form.role,
        otp: form.otp,
        newPassword: form.newPassword,
      });
      toast.success("Password reset! Please sign in.");
      setStep("done");
    } catch (err) {
      toast.error(err.response?.data?.error || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
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
              to="/login"
              className="text-sm text-slate-200 hover:text-white transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex items-start justify-center pt-10 sm:pt-16 px-4 pb-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-3">
              <Lock className="h-6 w-6 text-primary-500" />
            </div>
            <h1 className="text-xl font-bold text-primary-900">
              Reset Password
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {step === "request"
                ? "Enter your email to receive a reset code"
                : step === "reset"
                ? "Enter the code and your new password"
                : "Password reset successfully"}
            </p>
          </div>

          <div className="card">
            {step === "request" && (
              <form onSubmit={handleRequestReset} className="space-y-4">
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
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  loading={loading}
                >
                  Send Reset Code
                </Button>
              </form>
            )}

            {step === "reset" && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <Input
                  label="Reset OTP"
                  type="text"
                  placeholder="6-digit code"
                  value={form.otp}
                  onChange={(e) => setForm({ ...form, otp: e.target.value })}
                  required
                />
                <Input
                  label="New Password"
                  type="password"
                  placeholder="Min 8 characters"
                  value={form.newPassword}
                  onChange={(e) =>
                    setForm({ ...form, newPassword: e.target.value })
                  }
                  required
                  minLength={8}
                />
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  loading={loading}
                >
                  Reset Password
                </Button>
              </form>
            )}

            {step === "done" && (
              <div className="text-center py-4 space-y-4">
                <CheckCircle className="h-12 w-12 text-success-500 mx-auto" />
                <p className="text-sm text-slate-600">
                  Your password has been reset successfully.
                </p>
                <Link to="/login" className="btn-primary inline-block">
                  Sign In
                </Link>
              </div>
            )}
          </div>

          <div className="mt-4 text-center">
            <Link
              to="/login"
              className="text-sm text-primary-500 hover:underline inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
