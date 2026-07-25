import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Stethoscope, Building2 } from "lucide-react";
import toast from "react-hot-toast";
import { doctorAPI, hospitalAPI } from "../utils/api";
import Button from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";

function DoctorRegister() {
  const [form, setForm] = useState({
    name: "",
    specialization: "",
    hospitalId: "",
    registrationNumber: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    hospitalAPI
      .getAll()
      .then(({ data }) => setHospitals(data.hospitals))
      .catch(() => {});
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword)
      return toast.error("Passwords do not match");
    setLoading(true);
    try {
      await doctorAPI.register(form);
      toast.success("Registered! Awaiting admin approval.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed");
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

      <div className="flex-1 py-8 px-4">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-3">
              <Stethoscope className="h-6 w-6 text-primary-500" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary-900">
              Doctor Registration
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Register to join your hospital on MedTrace
            </p>
          </div>

          <form onSubmit={handleSubmit} className="card space-y-4">
            <Input
              label="Full Name *"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <Input
              label="Specialization *"
              name="specialization"
              placeholder="e.g. Cardiology"
              value={form.specialization}
              onChange={handleChange}
              required
            />
            <Select
              label="Hospital *"
              name="hospitalId"
              value={form.hospitalId}
              onChange={handleChange}
              required
            >
              <option value="">Select Hospital</option>
              {hospitals.map((h) => (
                <option key={h._id} value={h._id}>
                  {h.name}
                </option>
              ))}
            </Select>
            <Input
              label="Registration Number *"
              name="registrationNumber"
              placeholder="e.g. MCI-2024-12345"
              value={form.registrationNumber}
              onChange={handleChange}
              required
            />
            <Input
              label="Email *"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <Input
              label="Mobile *"
              name="mobile"
              placeholder="10-digit number"
              value={form.mobile}
              onChange={handleChange}
              required
            />
            <Input
              label="Password *"
              type="password"
              name="password"
              placeholder="Min 8 characters"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
            />
            <Input
              label="Confirm Password *"
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={loading}
            >
              Register as Doctor
            </Button>
            <p className="text-center text-xs text-slate-400">
              Already registered?{" "}
              <Link
                to="/login"
                className="text-primary-500 hover:underline font-medium"
              >
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default DoctorRegister;
