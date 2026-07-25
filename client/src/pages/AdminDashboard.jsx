import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Shield,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import toast from "react-hot-toast";
import { adminAPI } from "../utils/api";
import useAuthStore from "../store/authStore";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

const COLORS = ["#1B4B91", "#E63946", "#2A9D8F", "#F4A261"];

function AdminDashboard() {
  const { user } = useAuthStore();
  const [filter, setFilter] = useState("");

  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ["adminStats"],
    queryFn: () => adminAPI.getDashboardStats(),
  });

  const { data: doctorsData, refetch: refetchDoctors } = useQuery({
    queryKey: ["adminDoctors", filter],
    queryFn: () => adminAPI.getDoctors({ status: filter }),
  });

  const handleApprove = async (id, status) => {
    try {
      await adminAPI.approveDoctor(id, { status });
      toast.success(`Doctor ${status.toLowerCase()}`);
      refetchDoctors();
      refetchStats();
    } catch (err) {
      toast.error(
        err.response?.data?.error || "Could not update doctor status"
      );
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

  const accessData = [
    {
      name: "Normal OTP",
      count:
        (statsData?.totalAccessEvents || 0) - (statsData?.totalGlassBreak || 0),
    },
    { name: "Glass-Break", count: statsData?.totalGlassBreak || 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary-900">
          Admin Dashboard
        </h1>
        <p className="text-sm text-slate-400">
          {user?.name} &middot; Hospital Administrator
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Pending Doctors",
            value: statsData?.pendingDoctors || 0,
            icon: Clock,
            color: "text-warning-500",
            bg: "bg-warning-100",
          },
          {
            label: "Total Doctors",
            value: statsData?.totalDoctors || 0,
            icon: Users,
            color: "text-primary-500",
            bg: "bg-primary-100",
          },
          {
            label: "Glass-Break Events",
            value: statsData?.totalGlassBreak || 0,
            icon: AlertTriangle,
            color: "text-emergency-500",
            bg: "bg-emergency-100",
          },
          {
            label: "Flagged for Review",
            value: statsData?.flaggedEntries || 0,
            icon: Activity,
            color: "text-warning-500",
            bg: "bg-warning-100",
          },
        ].map((stat) => (
          <div key={stat.label} className="card !p-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full ${stat.bg} flex items-center justify-center`}
              >
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-ink">{stat.value}</p>
                <p className="text-xs text-slate-400">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-ink mb-4">
            Access Events Overview
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={accessData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, count }) => `${name}: ${count}`}
              >
                {accessData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-ink mb-4">
            Doctor Verification Status
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={[
                { name: "Pending", value: statsData?.pendingDoctors || 0 },
                {
                  name: "Approved",
                  value:
                    (statsData?.totalDoctors || 0) -
                    (statsData?.pendingDoctors || 0),
                },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E7EF" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#4A5568" }} />
              <YAxis tick={{ fontSize: 12, fill: "#4A5568" }} />
              <Tooltip />
              <Bar dataKey="value" fill="#1B4B91" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Doctor Approval Queue */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-base font-semibold text-ink flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary-500" /> Doctor Approval
            Queue
          </h2>
          <div className="flex gap-1 bg-slate-100 p-0.5 rounded-button self-start">
            {["Pending", "Approved", "Rejected"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1 text-xs font-medium rounded-button transition-colors ${
                  filter === s
                    ? "bg-surface text-primary-500 shadow-sm"
                    : "text-slate-500 hover:text-ink"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        {doctorsData?.doctors?.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {doctorsData.doctors.map((doctor) => (
              <div
                key={doctor._id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink text-sm truncate">
                      {doctor.name}
                    </span>
                    <Badge
                      variant={
                        doctor.verificationStatus === "Approved"
                          ? "approved"
                          : doctor.verificationStatus === "Rejected"
                          ? "rejected"
                          : "pending"
                      }
                    >
                      {doctor.verificationStatus}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {doctor.specialization} &middot;{" "}
                    {doctor.hospitalId?.name || "Unknown"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {doctor.certificateUrl && (
                    <a
                      href={doctor.certificateUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary-500 hover:underline"
                    >
                      View Certificate
                    </a>
                  )}
                  {doctor.verificationStatus === "Pending" && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={CheckCircle}
                        onClick={() => handleApprove(doctor._id, "Approved")}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={XCircle}
                        onClick={() => handleApprove(doctor._id, "Rejected")}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Shield}
            title={`No ${filter ? filter.toLowerCase() : ""} doctors found`}
            description={
              filter
                ? `No doctors with status "${filter}" require attention.`
                : "No doctors registered yet."
            }
          />
        )}
      </div>

      {/* Recent Glass-Break */}
      {statsData?.recentGlassBreak?.length > 0 && (
        <div className="card">
          <h2 className="text-base font-semibold text-ink mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-emergency-500" /> Recent
            Emergency Access
          </h2>
          <div className="divide-y divide-slate-100">
            {statsData.recentGlassBreak.map((event) => (
              <div
                key={event._id}
                className="py-2.5 flex items-center justify-between"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="rejected">Glass-Break</Badge>
                  <span className="text-sm text-ink truncate">
                    {event.doctorId?.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    → {event.patientId?.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {event.reviewFlag && (
                    <Badge variant="pending">Needs Review</Badge>
                  )}
                  <span className="text-xs text-slate-400">
                    {formatDate(event.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
