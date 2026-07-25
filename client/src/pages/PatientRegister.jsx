import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, Heart, AlertTriangle, Pill } from "lucide-react";
import toast from "react-hot-toast";
import { patientAPI } from "../utils/api";
import Button from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";

function PatientRegister() {
  const [form, setForm] = useState({
    name: "",
    dob: "",
    gender: "Male",
    mobile: "",
    email: "",
    bloodGroup: "A+",
    password: "",
    confirmPassword: "",
    allergies: "",
    chronicConditions: "",
    currentMedications: "",
    emergencyName: "",
    emergencyRelation: "",
    emergencyMobile: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    setLoading(true);
    try {
      const data = {
        name: form.name,
        dob: form.dob,
        gender: form.gender,
        mobile: form.mobile,
        email: form.email,
        bloodGroup: form.bloodGroup,
        password: form.password,
        allergies: form.allergies
          ? form.allergies.split(",").map((s) => s.trim())
          : [],
        chronicConditions: form.chronicConditions
          ? form.chronicConditions.split(",").map((s) => s.trim())
          : [],
        currentMedications: form.currentMedications
          ? form.currentMedications.split(",").map((s) => s.trim())
          : [],
        emergencyContact: form.emergencyName
          ? {
              name: form.emergencyName,
              relation: form.emergencyRelation,
              mobile: form.emergencyMobile,
            }
          : undefined,
      };
      const res = await patientAPI.register(data);
      toast.success(`Registered! Your Health ID: ${res.data.patient.healthId}`);
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
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-3">
              <UserPlus className="h-6 w-6 text-primary-500" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary-900">
              Patient Registration
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Get your unique 14-digit Health ID
            </p>
          </div>

          <form onSubmit={handleSubmit} className="card space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary-500" /> Personal
                Information
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Full Name *"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <Input
                  label="Date of Birth *"
                  type="date"
                  name="dob"
                  value={form.dob}
                  onChange={handleChange}
                  required
                />
                <Select
                  label="Gender *"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </Select>
                <Input
                  label="Mobile *"
                  name="mobile"
                  placeholder="10-digit number"
                  value={form.mobile}
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
                <Select
                  label="Blood Group *"
                  name="bloodGroup"
                  value={form.bloodGroup}
                  onChange={handleChange}
                >
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                    (bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    )
                  )}
                </Select>
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
              </div>
            </div>

            <div className="border-t pt-4">
              <h2 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary-500" /> Medical
                Information{" "}
                <span className="text-xs text-slate-400 font-normal">
                  (Optional)
                </span>
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <Input
                  label="Allergies"
                  name="allergies"
                  placeholder="e.g. Penicillin, Sulfa"
                  value={form.allergies}
                  onChange={handleChange}
                />
                <Input
                  label="Chronic Conditions"
                  name="chronicConditions"
                  placeholder="e.g. Diabetes, Asthma"
                  value={form.chronicConditions}
                  onChange={handleChange}
                />
                <Input
                  label="Current Medications"
                  name="currentMedications"
                  placeholder="e.g. Metformin"
                  value={form.currentMedications}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h2 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary-500" /> Emergency
                Contact{" "}
                <span className="text-xs text-slate-400 font-normal">
                  (Optional)
                </span>
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <Input
                  label="Name"
                  name="emergencyName"
                  value={form.emergencyName}
                  onChange={handleChange}
                />
                <Input
                  label="Relation"
                  name="emergencyRelation"
                  value={form.emergencyRelation}
                  onChange={handleChange}
                />
                <Input
                  label="Mobile"
                  name="emergencyMobile"
                  value={form.emergencyMobile}
                  onChange={handleChange}
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={loading}
            >
              Register & Get Health ID
            </Button>

            <p className="text-center text-xs text-slate-400">
              Already have an account?{" "}
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

export default PatientRegister;
