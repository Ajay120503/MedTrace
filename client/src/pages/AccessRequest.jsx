import React, { useState } from "react";
import toast from "react-hot-toast";
import { accessAPI, patientAPI, drugCheckAPI } from "../utils/api";
import useAuthStore from "../store/authStore";

function AccessRequest() {
  const { user } = useAuthStore();
  const [step, setStep] = useState("request");
  const [healthId, setHealthId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [otp, setOtp] = useState("");
  const [patientId, setPatientId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [history, setHistory] = useState([]);
  const [entryForm, setEntryForm] = useState({
    diagnosis: "",
    medicines: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await accessAPI.request({ patientHealthId: healthId });
      setSessionId(data.sessionId);
      setStep("otp");
      toast.success(`OTP sent to ${data.patientName}'s email`);
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
      const { data } = await accessAPI.verifyOtp({ sessionId, otp });
      setAccessToken(data.accessToken);
      setPatientId(data.patientId);
      setStep("view");
      toast.success("Access granted!");
      const hist = await patientAPI.getHistory(data.patientId);
      setHistory(hist.data.entries);
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
      const { data } = await patientAPI.addHistoryEntry(patientId, payload);
      toast.success("Entry added!");
      setEntryForm({ diagnosis: "", medicines: "", notes: "" });
      const hist = await patientAPI.getHistory(patientId);
      setHistory(hist.data.entries);
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error("Drug conflicts detected! Please confirm to proceed.");
      } else {
        toast.error(err.response?.data?.error || "Failed to add entry");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-primary-900">
        Access Patient Records
      </h1>

      {step === "request" && (
        <form onSubmit={handleRequest} className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Patient Health ID
            </label>
            <input
              className="input-field font-mono"
              placeholder="14-digit Health ID"
              value={healthId}
              onChange={(e) =>
                setHealthId(e.target.value.replace(/\D/g, "").slice(0, 14))
              }
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading}
          >
            {loading ? "Requesting..." : "Request Access"}
          </button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyOtp} className="card space-y-4">
          <p className="text-sm text-slate-600">
            Enter the OTP sent to the patient's email
          </p>
          <div>
            <input
              className="input-field text-center text-2xl font-mono tracking-widest"
              placeholder="000000"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
      )}

      {step === "view" && (
        <>
          <div className="card">
            <h2 className="text-lg font-semibold text-primary-900 mb-4">
              Medical History
            </h2>
            {history.length > 0 ? (
              <div className="space-y-3">
                {history.map((entry) => (
                  <div
                    key={entry._id}
                    className="border border-slate-200 rounded-card p-3"
                  >
                    <p className="font-medium text-ink">{entry.diagnosis}</p>
                    <p className="text-sm text-slate-600">
                      {new Date(entry.visitDate).toLocaleDateString()}
                    </p>
                    {entry.prescribedMedicines?.length > 0 && (
                      <p className="text-sm text-slate-600">
                        Rx: {entry.prescribedMedicines.join(", ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-4">
                No history available
              </p>
            )}
          </div>

          <form onSubmit={handleAddEntry} className="card space-y-4">
            <h2 className="text-lg font-semibold text-primary-900">
              Add New Entry
            </h2>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Diagnosis *
              </label>
              <textarea
                className="input-field"
                value={entryForm.diagnosis}
                onChange={(e) =>
                  setEntryForm({ ...entryForm, diagnosis: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Prescribed Medicines
              </label>
              <input
                className="input-field"
                placeholder="Comma-separated"
                value={entryForm.medicines}
                onChange={(e) =>
                  setEntryForm({ ...entryForm, medicines: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Notes
              </label>
              <textarea
                className="input-field"
                value={entryForm.notes}
                onChange={(e) =>
                  setEntryForm({ ...entryForm, notes: e.target.value })
                }
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? "Saving..." : "Add Entry"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default AccessRequest;
