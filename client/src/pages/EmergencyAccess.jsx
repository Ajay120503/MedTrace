import React, { useState } from "react";
import {
  Search,
  AlertTriangle,
  Shield,
  CheckCircle,
  FileWarning,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import { emergencyAPI } from "../utils/api";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { Input, Select } from "../components/ui/Input";

function EmergencyAccess() {
  const [step, setStep] = useState("lookup");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("healthId");
  const [patient, setPatient] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);

  const handleLookup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {};
      if (searchType === "healthId") payload.patientHealthId = searchQuery;
      else if (searchType === "email") payload.patientEmail = searchQuery;
      else payload.patientMobile = searchQuery;

      const response = await emergencyAPI.lookup(payload);
      setPatient(response);
      setStep("confirm");
      toast.success("Patient identified");
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
          "Patient not found with the provided information"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBreakGlass = async () => {
    if (!confirmed) {
      toast.error("Please confirm that this is a genuine emergency");
      return;
    }
    setLoading(true);
    try {
      const response = await emergencyAPI.breakGlass(patient.patientId, {
        confirmed: true,
      });
      setPatientData(response.data || response);
      setStep("result");
      toast.success("Emergency access granted");
    } catch (err) {
      toast.error(
        err.response?.data?.error || "Emergency access could not be completed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emergency-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-emergency-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-emergency-700">
            Emergency Access
          </h1>
          <p className="text-sm text-slate-400">
            Glass-Break protocol for situations where patient consent cannot be
            obtained
          </p>
        </div>
      </div>

      {step === "lookup" && (
        <form onSubmit={handleLookup} className="card space-y-4">
          <div className="bg-warning-100 p-3 rounded-button flex items-start gap-2">
            <FileWarning className="h-4 w-4 text-warning-700 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-warning-700">
              This initiates the emergency access protocol. Only approved
              doctors can use this. All access is logged and audited.
            </p>
          </div>

          <Select
            label="Search by"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
          >
            <option value="healthId">Health ID</option>
            <option value="email">Email Address</option>
            <option value="mobile">Mobile Number</option>
          </Select>

          <Input
            label={`Patient ${
              searchType === "healthId"
                ? "Health ID"
                : searchType === "email"
                ? "Email"
                : "Mobile"
            }`}
            placeholder={
              searchType === "healthId"
                ? "14-digit Health ID"
                : searchType === "email"
                ? "patient@example.com"
                : "10-digit mobile number"
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="danger"
            className="w-full"
            icon={Search}
            loading={loading}
          >
            Find Patient
          </Button>
        </form>
      )}

      {step === "confirm" && patient && (
        <div className="space-y-4">
          <div className="card border-2 border-emergency-500">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emergency-100 flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-emergency-500" />
              </div>
              <div>
                <p className="font-medium text-ink">{patient.name}</p>
                <p className="text-sm text-slate-400">
                  Blood Group:{" "}
                  <span className="font-mono font-medium text-ink">
                    {patient.bloodGroup}
                  </span>
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-emergency-100 rounded-button">
                <Shield className="h-4 w-4 text-emergency-700 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-emergency-700 space-y-1">
                  <p className="font-medium">
                    Emergency Protocol — 4 Safeguards
                  </p>
                  <p>1. Only approved doctors can initiate this access</p>
                  <p>2. You must explicitly confirm the emergency</p>
                  <p>3. Only minimum necessary fields will be released</p>
                  <p>
                    4. Nominees will be notified; if none exist, this is flagged
                    for admin review
                  </p>
                </div>
              </div>
            </div>

            <label className="flex items-start gap-3 mt-4 p-3 border border-emergency-500 rounded-button cursor-pointer hover:bg-emergency-100/50 transition-colors">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-emergency-500 rounded focus:ring-emergency-500"
              />
              <span className="text-sm text-ink font-medium">
                I confirm this is a genuine emergency requiring immediate access
                to this patient's critical medical information. I understand
                this action will be logged and audited.
              </span>
            </label>
          </div>

          <Button
            onClick={handleBreakGlass}
            variant="danger"
            className="w-full text-base py-3"
            disabled={!confirmed || loading}
            loading={loading}
          >
            BREAK GLASS — Emergency Access
          </Button>
        </div>
      )}

      {step === "result" && patientData && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-3 mb-4 p-3 bg-emergency-100 rounded-button">
              <CheckCircle className="h-5 w-5 text-emergency-700" />
              <div>
                <p className="font-medium text-emergency-700 text-sm">
                  Emergency Access Granted
                </p>
                <p className="text-xs text-emergency-700/70">
                  Minimum necessary fields retrieved
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="border border-slate-200 rounded-card p-3">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                  Blood Group
                </p>
                <p className="text-lg font-bold font-mono text-ink">
                  {patientData.bloodGroup}
                </p>
              </div>
              {patientData.profilePhotoUrl && (
                <div className="border border-slate-200 rounded-card p-3 flex items-center justify-center">
                  <img
                    src={patientData.profilePhotoUrl}
                    alt="Patient"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                </div>
              )}
              <div className="border border-slate-200 rounded-card p-3">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                  Allergies
                </p>
                <p className="text-sm text-ink">
                  {patientData.allergies?.length > 0 ? (
                    patientData.allergies.join(", ")
                  ) : (
                    <span className="text-slate-400">None recorded</span>
                  )}
                </p>
              </div>
              <div className="border border-slate-200 rounded-card p-3">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                  Current Medications
                </p>
                <p className="text-sm text-ink">
                  {patientData.currentMedications?.length > 0 ? (
                    patientData.currentMedications.join(", ")
                  ) : (
                    <span className="text-slate-400">None recorded</span>
                  )}
                </p>
              </div>
              <div className="border border-slate-200 rounded-card p-3 col-span-2">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                  Chronic Conditions
                </p>
                <p className="text-sm text-ink">
                  {patientData.chronicConditions?.length > 0 ? (
                    patientData.chronicConditions.join(", ")
                  ) : (
                    <span className="text-slate-400">None recorded</span>
                  )}
                </p>
              </div>
              {patientData.emergencyContact?.name && (
                <div className="border border-slate-200 rounded-card p-3 col-span-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                    Emergency Contact
                  </p>
                  <p className="text-sm text-ink">
                    {patientData.emergencyContact.name} (
                    {patientData.emergencyContact.relation})
                  </p>
                  <p className="text-sm text-slate-400">
                    {patientData.emergencyContact.mobile}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              setStep("lookup");
              setPatient(null);
              setPatientData(null);
              setConfirmed(false);
            }}
          >
            New Emergency Access
          </Button>
        </div>
      )}
    </div>
  );
}

export default EmergencyAccess;
