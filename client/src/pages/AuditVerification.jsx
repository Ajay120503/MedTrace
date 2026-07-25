import React, { useState } from "react";
import toast from "react-hot-toast";
import { adminAPI } from "../utils/api";

function AuditVerification() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    try {
      const result = await adminAPI.verifyAudit();
      setResult(result);
      if (result.valid) {
        toast.success("Audit chain is intact!");
      } else {
        toast.error("Tampering detected!");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-900">
          Audit Chain Verification
        </h1>
        <p className="text-slate-600">
          Verify the integrity of the hash-chained audit log
        </p>
      </div>

      <div className="card text-center space-y-4">
        <p className="text-slate-600">
          This will walk through every entry in the audit log and verify the
          SHA-256 hash chain from genesis.
        </p>
        <button
          onClick={handleVerify}
          className="btn-primary"
          disabled={loading}
        >
          {loading ? "Verifying Chain..." : "Run Full Chain Verification"}
        </button>
      </div>

      {result && (
        <div
          className={`card ${
            result.valid
              ? "border-success-500 border"
              : "border-emergency-500 border-2"
          }`}
        >
          <div className="text-center mb-4">
            <div
              className={`text-4xl mb-2 ${
                result.valid ? "text-success-500" : "text-emergency-500"
              }`}
            >
              {result.valid ? "✓" : "✗"}
            </div>
            <h2
              className={`text-xl font-bold ${
                result.valid ? "text-success-700" : "text-emergency-700"
              }`}
            >
              {result.valid ? "Chain Verified" : "Tampering Detected!"}
            </h2>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Status</span>
              <span
                className={`font-medium ${
                  result.valid ? "text-success-700" : "text-emergency-700"
                }`}
              >
                {result.valid ? "Intact" : "Compromised"}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Total Entries</span>
              <span className="font-medium text-ink">
                {result.totalEntries}
              </span>
            </div>
            {result.breakAtEntryId && (
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Break Point</span>
                <span className="font-mono text-xs text-emergency-700">
                  {result.breakAtEntryId}
                </span>
              </div>
            )}
          </div>

          <p className="text-center text-sm text-slate-600 mt-4">
            {result.message}
          </p>
        </div>
      )}
    </div>
  );
}

export default AuditVerification;
