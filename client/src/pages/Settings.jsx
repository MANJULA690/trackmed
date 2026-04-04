import { useState } from "react";
import { authAPI } from "../api/services";
import { PageHeader } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../utils/helpers";
import toast from "react-hot-toast";

export default function Settings() {
  const { user } = useAuth();
  const [pwForm,    setPwForm]    = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [submitting, setSubmitting] = useState(false);

  const handlePw = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      await authAPI.updatePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success("Password updated!");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account preferences" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-3xl">
        {/* Profile card */}
        <div className="card p-6">
          <h3 className="font-display font-bold text-gray-900 text-sm mb-5">Your Profile</h3>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-brand-500 flex items-center justify-center text-white text-lg font-bold">
              {getInitials(user?.name || "")}
            </div>
            <div>
              <p className="font-medium text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-400">{user?.email}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block font-medium ${
                user?.role === "admin" ? "bg-purple-50 text-purple-700" :
                user?.role === "pharmacist" ? "bg-brand-50 text-brand-700" : "bg-gray-100 text-gray-600"
              }`}>{user?.role}</span>
            </div>
          </div>
          <div className="space-y-3 text-sm border-t border-gray-100 pt-4">
            {[
              ["Department", user?.department || "—"],
              ["Role",       user?.role],
              ["Account ID", user?.id?.slice(-8) || "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-gray-400">{k}</span>
                <span className="font-medium text-gray-700 font-mono text-xs">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Change password */}
        <div className="card p-6">
          <h3 className="font-display font-bold text-gray-900 text-sm mb-5">Change Password</h3>
          <form onSubmit={handlePw} className="space-y-4">
            {[
              ["Current password",  "currentPassword",  "Enter your current password"],
              ["New password",      "newPassword",       "Min. 6 characters"],
              ["Confirm password",  "confirmPassword",   "Re-enter new password"],
            ].map(([label, key, placeholder]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input
                  type="password"
                  required
                  minLength={key !== "currentPassword" ? 6 : undefined}
                  placeholder={placeholder}
                  value={pwForm[key]}
                  onChange={e => setPwForm({ ...pwForm, [key]: e.target.value })}
                  className="input-base"
                />
              </div>
            ))}
            <button type="submit" disabled={submitting} className="btn-primary w-full justify-center mt-2">
              {submitting ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>

        {/* System info card */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="font-display font-bold text-gray-900 text-sm mb-4">System Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              ["Version",    "TrackMed v1.0"],
              ["Project",    "6th Semester"],
              ["Tech Stack", "React + Node + MongoDB"],
              ["ML Model",   "WMA + Linear Regression"],
            ].map(([k, v]) => (
              <div key={k} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">{k}</p>
                <p className="font-medium text-gray-700 text-xs">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
