import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  QrCode,
  FileText,
  UserPlus,
  Activity,
  Eye,
  Users,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { patientAPI, nomineeAPI } from "../utils/api";
import useAuthStore from "../store/authStore";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import EmptyState from "../components/ui/EmptyState";

function PatientDashboard() {
  const { user } = useAuthStore();
  const [nomineeForm, setNomineeForm] = useState({
    name: "",
    relation: "",
    mobile: "",
    email: "",
  });
  const [showNomineeForm, setShowNomineeForm] = useState(false);

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["patientHistory", user?.id],
    queryFn: () => patientAPI.getHistory(user.id),
    enabled: !!user?.id,
  });

  const { data: accessLogData } = useQuery({
    queryKey: ["accessLog", user?.id],
    queryFn: () => patientAPI.getAccessLog(user.id),
    enabled: !!user?.id,
  });

  const { data: nomineesData, refetch: refetchNominees } = useQuery({
    queryKey: ["nominees"],
    queryFn: () => nomineeAPI.getAll(),
  });

  const handleAddNominee = async (e) => {
    e.preventDefault();
    try {
      await nomineeAPI.add(nomineeForm);
      toast.success("Nominee added! Ask them to confirm via email.");
      setNomineeForm({ name: "", relation: "", mobile: "", email: "" });
      setShowNomineeForm(false);
      refetchNominees();
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not add nominee");
    }
  };

  const handleConfirmNominee = async (id) => {
    try {
      await nomineeAPI.confirm(id);
      toast.success("Nominee confirmed — they will be notified in emergencies");
      refetchNominees();
    } catch (err) {
      toast.error("Could not confirm nominee");
    }
  };

  const handleExportPDF = async () => {
    try {
      const blob = await patientAPI.exportPDF(user.id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `medtrace-history-${user.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Medical history PDF downloaded");
    } catch (err) {
      toast.error("Could not generate PDF");
    }
  };

  const handleShowQR = async () => {
    try {
      const data = await patientAPI.getQR(user.id);
      const win = window.open("", "_blank", "width=400,height=500");
      win.document.write(`
        <html><head><title>MedTrace - Your Health ID</title>
        <style>body{font-family:Inter,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc;padding:20px}
        img{max-width:280px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1)}
        .id{font-family:'JetBrains Mono',monospace;font-size:18px;color:#1b263b;margin-top:20px;letter-spacing:2px}
        .label{font-size:12px;color:#8b95a5;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
        </style></head><body>
        <div class="label">Your Health ID</div>
        <div class="id">${data.healthId}</div>
        <img src="${data.qrCode}" alt="Health ID QR Code"/>
        <p style="color:#4a5568;font-size:13px;margin-top:16px;text-align:center">Share this QR code with your doctor<br/>to quickly request access</p>
        </body></html>
      `);
    } catch (err) {
      toast.error("Could not generate QR code");
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
    <div className="space-y-6">
      <div className="rounded-card border border-primary-200 bg-surface p-5 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-button bg-success-100 px-2.5 py-1 text-xs font-medium text-success-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Protected medical profile
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary-900">
              Welcome, {user?.name}
            </h1>
            <p className="text-sm text-slate-600">
              Manage records, nominees, and every access event from one place.
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <Button
              variant="secondary"
              size="sm"
              icon={QrCode}
              onClick={handleShowQR}
              className="w-full"
            >
              Show QR
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={FileText}
              onClick={handleExportPDF}
              className="w-full"
            >
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Medical History */}
      <div className="card">
        <h2 className="text-base font-semibold text-ink mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary-500" /> Medical History
        </h2>
        {historyLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 bg-slate-100 rounded-card animate-pulse"
              />
            ))}
          </div>
        ) : historyData?.entries?.length > 0 ? (
          <div className="space-y-2">
            {historyData.entries.map((entry) => (
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
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Activity}
            title="No medical history yet"
            description="Your doctor will add entries during your visits."
          />
        )}
      </div>

      {/* Access Log */}
      <div className="card">
        <h2 className="text-base font-semibold text-ink mb-4 flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary-500" /> Who Viewed My Data
        </h2>
        {accessLogData?.logs?.length > 0 ? (
          <div className="space-y-2">
            {accessLogData.logs.map((log) => (
              <div
                key={log._id}
                className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Badge
                    variant={
                      log.accessType === "Glass-Break" ? "rejected" : "approved"
                    }
                  >
                    {log.accessType}
                  </Badge>
                  <span className="text-sm text-ink truncate">
                    {log.doctorId?.name || "Unknown"}
                  </span>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                  {formatDate(log.timestamp)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Eye}
            title="No access events yet"
            description="When a doctor views your records, it will appear here."
          />
        )}
      </div>

      {/* Nominees */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-ink flex items-center gap-2">
            <Users className="h-4 w-4 text-primary-500" /> Emergency Nominees
          </h2>
          <Button
            variant="secondary"
            size="sm"
            icon={UserPlus}
            onClick={() => setShowNomineeForm(!showNomineeForm)}
          >
            {showNomineeForm ? "Cancel" : "Add Nominee"}
          </Button>
        </div>

        {showNomineeForm && (
          <form
            onSubmit={handleAddNominee}
            className="grid sm:grid-cols-4 gap-3 mb-4 p-4 bg-slate-100 rounded-card"
          >
            <Input
              placeholder="Full name"
              value={nomineeForm.name}
              onChange={(e) =>
                setNomineeForm({ ...nomineeForm, name: e.target.value })
              }
              required
            />
            <Input
              placeholder="Relation"
              value={nomineeForm.relation}
              onChange={(e) =>
                setNomineeForm({ ...nomineeForm, relation: e.target.value })
              }
              required
            />
            <Input
              placeholder="Mobile"
              value={nomineeForm.mobile}
              onChange={(e) =>
                setNomineeForm({ ...nomineeForm, mobile: e.target.value })
              }
              required
            />
            <Input
              type="email"
              placeholder="Email"
              value={nomineeForm.email}
              onChange={(e) =>
                setNomineeForm({ ...nomineeForm, email: e.target.value })
              }
              required
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="sm:col-span-4"
            >
              Add Nominee
            </Button>
          </form>
        )}

        {nomineesData?.nominees?.length > 0 ? (
          <div className="space-y-2">
            {nomineesData.nominees.map((nominee) => (
              <div
                key={nominee._id}
                className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-ink">
                    {nominee.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({nominee.relation})
                  </span>
                  <Badge
                    variant={
                      nominee.status === "Confirmed" ? "approved" : "pending"
                    }
                  >
                    {nominee.status}
                  </Badge>
                </div>
                {nominee.status === "Pending" && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleConfirmNominee(nominee._id)}
                  >
                    Confirm
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="No nominees added yet"
            description="Add family members who should be notified in an emergency."
            action={
              <Button
                variant="primary"
                size="sm"
                icon={UserPlus}
                onClick={() => setShowNomineeForm(true)}
              >
                Add Your First Nominee
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}

export default PatientDashboard;
