import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Key, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { userAPI } from "../utils/api";
import useAuthStore from "../store/authStore";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";

function Profile() {
  const { user, updateUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    mobile: user?.mobile || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("profile");
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await userAPI.updateProfile(profileForm);
      updateUser(data.user);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPass !== passwordForm.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await userAPI.changePassword({
        currentPassword: passwordForm.current,
        newPassword: passwordForm.newPass,
      });
      toast.success("Password changed. Please login again.");
      setPasswordForm({ current: "", newPass: "", confirm: "" });
      setTimeout(() => {
        logout();
        navigate("/login");
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not change password");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutEverywhere = async () => {
    setLogoutLoading(true);
    try {
      await userAPI.logoutEverywhere();
      logout();
      navigate("/login");
    } catch (err) {
      toast.error("Could not logout everywhere");
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
          <User className="h-5 w-5 text-primary-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-primary-900">
            Profile Settings
          </h1>
          <p className="text-sm text-slate-400">
            {user?.name} &middot; {user?.email}
          </p>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 p-0.5 rounded-button">
        <button
          onClick={() => setTab("profile")}
          className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-button transition-colors ${
            tab === "profile"
              ? "bg-surface text-primary-500 shadow-sm"
              : "text-slate-500 hover:text-ink"
          }`}
        >
          <User className="h-3.5 w-3.5 inline mr-1" /> Edit Profile
        </button>
        <button
          onClick={() => setTab("password")}
          className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-button transition-colors ${
            tab === "password"
              ? "bg-surface text-primary-500 shadow-sm"
              : "text-slate-500 hover:text-ink"
          }`}
        >
          <Lock className="h-3.5 w-3.5 inline mr-1" /> Password
        </button>
      </div>

      <div className="card">
        {tab === "profile" ? (
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <Input
              label="Full Name"
              value={profileForm.name}
              onChange={(e) =>
                setProfileForm({ ...profileForm, name: e.target.value })
              }
              required
            />
            <Input
              label="Mobile"
              value={profileForm.mobile}
              onChange={(e) =>
                setProfileForm({ ...profileForm, mobile: e.target.value })
              }
            />
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={loading}
            >
              Update Profile
            </Button>
          </form>
        ) : (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              value={passwordForm.current}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, current: e.target.value })
              }
              required
            />
            <Input
              label="New Password"
              type="password"
              placeholder="Min 8 characters"
              value={passwordForm.newPass}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, newPass: e.target.value })
              }
              required
              minLength={8}
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={passwordForm.confirm}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirm: e.target.value })
              }
              required
            />
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={loading}
            >
              Change Password
            </Button>
          </form>
        )}
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
          <Key className="h-4 w-4 text-primary-500" /> Security
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Log out from all devices and invalidate all active sessions.
        </p>
        <Button
          variant="danger"
          size="sm"
          onClick={handleLogoutEverywhere}
          loading={logoutLoading}
        >
          Logout Everywhere
        </Button>
      </div>
    </div>
  );
}

export default Profile;
