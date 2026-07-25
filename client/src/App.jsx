import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "./store/authStore";

// Layout
import Layout from "./components/layout/Layout";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import PatientRegister from "./pages/PatientRegister";
import DoctorRegister from "./pages/DoctorRegister";
import HospitalRegister from "./pages/HospitalRegister";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AccessRequest from "./pages/AccessRequest";
import EmergencyAccess from "./pages/EmergencyAccess";
import AuditVerification from "./pages/AuditVerification";

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          isAuthenticated && user ? (
            <Navigate to={`/${user.role}`} />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route path="/register/patient" element={<PatientRegister />} />
      <Route path="/register/doctor" element={<DoctorRegister />} />
      <Route path="/register/hospital" element={<HospitalRegister />} />

      <Route
        path="/patient"
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <Layout role="patient">
              <PatientDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor"
        element={
          <ProtectedRoute allowedRoles={["doctor"]}>
            <Layout role="doctor">
              <DoctorDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor/access"
        element={
          <ProtectedRoute allowedRoles={["doctor"]}>
            <Layout role="doctor">
              <AccessRequest />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor/emergency"
        element={
          <ProtectedRoute allowedRoles={["doctor"]}>
            <Layout role="doctor">
              <EmergencyAccess />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Layout role="admin">
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/audit"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Layout role="admin">
              <AuditVerification />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
