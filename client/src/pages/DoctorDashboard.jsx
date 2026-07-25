import React from "react";
import { Link } from "react-router-dom";
import {
  Stethoscope,
  FileText,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import useAuthStore from "../store/authStore";
import Badge from "../components/ui/Badge";

function DoctorDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
          <Stethoscope className="h-5 w-5 text-primary-500" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary-900">
            Doctor Dashboard
          </h1>
          <p className="text-sm text-slate-400">Dr. {user?.name}</p>
          <div className="mt-1">
            {user?.verificationStatus === "Approved" ? (
              <Badge variant="approved">Approved</Badge>
            ) : (
              <Badge variant="pending">Pending Approval</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link
          to="/doctor/access"
          className="card hover:shadow-md transition-shadow block group"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-200 transition-colors">
              <FileText className="h-5 w-5 text-primary-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink group-hover:text-primary-500 transition-colors">
                Normal Access
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Request OTP-based access to a patient's full medical records.
                Patient receives an email OTP to grant consent.
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/doctor/emergency"
          className="card border-2 border-emergency-500 hover:shadow-md transition-shadow block group"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-emergency-100 flex items-center justify-center flex-shrink-0 group-hover:bg-emergency-200 transition-colors">
              <AlertTriangle className="h-5 w-5 text-emergency-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-emergency-700">
                Glass-Break Emergency
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Emergency access when patient consent cannot be obtained. Only
                minimum necessary fields are released.
              </p>
            </div>
          </div>
        </Link>
      </div>

      <div className="card">
        <h2 className="text-base font-semibold text-ink mb-3">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link
            to="/doctor/access"
            className="btn-primary text-center text-sm py-2.5"
          >
            Access Patient Records
          </Link>
          <Link
            to="/doctor/emergency"
            className="btn-danger text-center text-sm py-2.5"
          >
            Emergency Access
          </Link>
        </div>
      </div>
    </div>
  );
}

export default DoctorDashboard;
