import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { hospitalAPI } from "../utils/api";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";

function HospitalRegister() {
  const [step, setStep] = useState("hospital");
  const [hospital, setHospital] = useState({
    name: "",
    address: "",
    contact: "",
  });
  const [admin, setAdmin] = useState({ name: "", email: "", password: "" });
  const [hospitalId, setHospitalId] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleHospitalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await hospitalAPI.register(hospital);
      setHospitalId(data.hospital._id);
      toast.success("Hospital registered! Now create the admin account.");
      setStep("admin");
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await hospitalAPI.registerAdmin({ ...admin, hospitalId });
      toast.success("Hospital setup complete! You can now sign in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create admin");
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
              <Building2 className="h-6 w-6 text-primary-500" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary-900">
              Hospital Registration
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {step === "hospital"
                ? "Register your hospital on MedTrace"
                : "Create the hospital administrator account"}
            </p>
          </div>

          {step === "hospital" ? (
            <form onSubmit={handleHospitalSubmit} className="card space-y-4">
              <Input
                label="Hospital Name *"
                value={hospital.name}
                onChange={(e) =>
                  setHospital({ ...hospital, name: e.target.value })
                }
                required
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-ink">
                  Address *
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-slate-200 rounded-input bg-surface text-ink placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-sm"
                  value={hospital.address}
                  onChange={(e) =>
                    setHospital({ ...hospital, address: e.target.value })
                  }
                  required
                />
              </div>
              <Input
                label="Contact *"
                value={hospital.contact}
                onChange={(e) =>
                  setHospital({ ...hospital, contact: e.target.value })
                }
                required
              />
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                loading={loading}
              >
                Register Hospital
              </Button>
            </form>
          ) : (
            <form onSubmit={handleAdminSubmit} className="card space-y-4">
              <div className="flex items-center gap-2 p-3 bg-success-100 rounded-button">
                <CheckCircle className="h-4 w-4 text-success-700 flex-shrink-0" />
                <p className="text-xs text-success-700">
                  Hospital registered. Now create the admin account.
                </p>
              </div>
              <Input
                label="Admin Name *"
                value={admin.name}
                onChange={(e) => setAdmin({ ...admin, name: e.target.value })}
                required
              />
              <Input
                label="Admin Email *"
                type="email"
                value={admin.email}
                onChange={(e) => setAdmin({ ...admin, email: e.target.value })}
                required
              />
              <Input
                label="Admin Password *"
                type="password"
                value={admin.password}
                onChange={(e) =>
                  setAdmin({ ...admin, password: e.target.value })
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
                Complete Registration
              </Button>
            </form>
          )}

          <p className="text-center text-xs text-slate-400 mt-4">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary-500 hover:underline font-medium"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default HospitalRegister;
