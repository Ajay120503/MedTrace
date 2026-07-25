import React, { useState } from "react";
import { Search, Shield, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { accessAPI, patientAPI } from "../utils/api";
import useAuthStore from "../store/authStore";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import EmptyState from "../components/ui/EmptyState";
import Badge from "../components/ui/Badge";

function AccessRequest() {
  const { user } = useAuthStore();
  const [step, setStep] = useState("request");
  const [healthId, setHealthId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [otp, setOtp] = useState("");
  const [patientId, setPatientId] = useState("");
  const [history, setHistory] = useState([]);
  const [patientInfo, setPatientInfo] = useState(null);
  const [entryForm, setEntryForm] = useState({
    diagnosis: "",
    medicines: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [conflictData, setConflictData] = useState(null);

  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await accessAPI.request({ patientHealthId: healthId });
      setSessionId(response.sessionId);
      setPatientInfo(response);
      setStep("otp");
      toast.success(`OTP sent to ${response.patientName}'s email`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await accessAPI.verifyOtp({ sessionId, otp });
      setPatientId(response.patientId);
      setStep("view");
      toast.success("Access granted!");
      const historyResponse = await patientAPI.getHistory(response.patientId);
      setHistory(historyResponse.entries || []);
    } catch (err) {
      toast.error(err.response?.data?.error || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const medicines = entryForm.medicines
        ? entryForm.medicines.split(",").map((s) => s.trim())
        : [];
      const payload = {
        diagnosis: entryForm.diagnosis,
        prescribedMedicines: medicines,
        notes: entryForm.notes,
      };
      await patientAPI.addHistoryEntry(patientId, payload);
      toast.success("Entry added!");
      setEntryForm({ diagnosis: "", medicines: "", notes: "" });
      const historyResponse = await patientAPI.getHistory(patientId);
      setHistory(historyResponse.entries || []);
    } catch (err) {
      if (err.response?.status === 409) {
        setConflictData(err.response.data);
        toast.error("Drug conflicts detected! Please confirm to proceed.");
      } else {
        toast.error(err.response?.data?.error || "Failed to add entry");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmConflict = async () => {
    setLoading(true);
    try {
      const medicines = entryForm.medicines
        ? entryForm.medicines.split(",").map((s) => s.trim())
        : [];
      const payload = {
        diagnosis: entryForm.diagnosis,
        prescribedMedicines: medicines,
        notes: entryForm.notes,
        drugConflictConfirmed: true,
        drugConflictNotes: "Confirmed by doctor after review",
      };
      await patientAPI.addHistoryEntry(patientId, payload);
      toast.success("Entry added with conflict confirmation!");
      setConflictData(null);
      setEntryForm({ diagnosis: "", medicines: "", notes: "" });
      const historyResponse = await patientAPI.getHistory(patientId);
      setHistory(historyResponse.entries || []);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add entry");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
          <Search className="h-5 w-5 text-primary-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-primary-900">
            Access Patient Records
          </h1>
          <p className="text-sm text-slate-400">
            Request OTP-based access to patient medical history
          </p>
        </div>
      </div>

      {step === "request" && (
        <form onSubmit={handleRequest} className="card space-y-4">
          <Input
            label="Patient Health ID"
            className="font-mono"
            placeholder="14-digit Health ID"
            value={healthId}
            onChange={(e) =>
              setHealthId(e.target.value.replace(/\D/g, "").slice(0, 14))
            }
            required
          />
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            icon={Search}
            loading={loading}
          >
            Request Access
          </Button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyOtp} className="card space-y-4">
          <div className="bg-primary-100 p-3 rounded-button">
            <p className="text-sm text-primary-700">
              OTP sent to {patientInfo?.patientName || "patient"}'s email. Enter
              the 6-digit code below.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              OTP Code
            </label>
            <input
              className="input-field text-center text-2xl font-mono tracking-widest"
              placeholder="000000"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              required
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            icon={Shield}
            loading={loading}
          >
            Verify OTP
          </Button>
        </form>
      )}

      {step === "view" && (
        <>
          <div className="card">
            <h2 className="text-base font-semibold text-ink mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary-500" /> Medical History
            </h2>
            {history.length > 0 ? (
              <div className="space-y-2">
                {history.map((entry) => (
                  <div
                    key={entry._id}
                    className="border border-slate-200 rounded-card p-3 sm:p-4 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-ink text-sm">
                          {entry.diagnosis}
                        </span>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Dr. {entry.doctorId?.name} &middot;{" "}
                          {entry.hospitalId?.name}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {formatDate(entry.visitDate)}
                      </span>
                    </div>
                    {entry.prescribedMedicines?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {entry.prescribedMedicines.map((med, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-primary-100 text-primary-700 font-mono"
                          >
                            {med}
                          </span>
                        ))}
                      </div>
                    )}
                    {entry.notes && (
                      <p className="text-xs text-slate-400 mt-1 italic">
                        {entry.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={FileText}
                title="No medical history"
                description="This patient has no previous entries."
              />
            )}
          </div>

          {conflictData && (
            <div className="card border-2 border-emergency-500 bg-emergency-100">
              <h3 className="text-sm font-semibold text-emergency-700 mb-3">
                ⚠️ Drug Conflicts Detected
              </h3>
              <div className="space-y-2 mb-4">
                {conflictData.conflicts?.map((c, i) => (
                  <div key={i} className="p-2 bg-white rounded-button text-sm">
                    <p className="font-medium text-ink">{c.drug}</p>
                    {c.allergyHit && (
                      <p className="text-xs text-emergency-700">
                        Allergy trigger detected
                      </p>
                    )}
                    {c.interactionHit && (
                      <p className="text-xs text-warning-700">
                        Drug interaction detected
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleConfirmConflict}
                  loading={loading}
                >
                  Confirm & Override
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConflictData(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {!conflictData && (
            <form onSubmit={handleAddEntry} className="card space-y-4">
              <h2 className="text-base font-semibold text-ink">
                Add New Entry
              </h2>
              <Input
                label="Diagnosis"
                type="textarea"
                value={entryForm.diagnosis}
                onChange={(e) =>
                  setEntryForm({ ...entryForm, diagnosis: e.target.value })
                }
                required
              />
              <Input
                label="Prescribed Medicines"
                placeholder="Comma-separated drug names"
                value={entryForm.medicines}
                onChange={(e) =>
                  setEntryForm({ ...entryForm, medicines: e.target.value })
                }
              />
              <Input
                label="Notes"
                value={entryForm.notes}
                onChange={(e) =>
                  setEntryForm({ ...entryForm, notes: e.target.value })
                }
              />
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                icon={FileText}
                loading={loading}
              >
                Add Entry
              </Button>
            </form>
          )}
        </>
      )}
    </div>
  );
}

export default AccessRequest;
