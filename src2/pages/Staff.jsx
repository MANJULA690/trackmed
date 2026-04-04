import { useState } from "react";
import { authAPI } from "../api/services";
import { PageHeader, Modal, EmptyState, PageLoader } from "../components/ui";
import { useFetch } from "../hooks/useFetch";
import { formatDate, getInitials } from "../utils/helpers";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const ROLE_COLORS = {
  admin:       "bg-purple-50 text-purple-700",
  pharmacist:  "bg-brand-50 text-brand-700",
  staff:       "bg-gray-100 text-gray-600",
};

const EMPTY_FORM = { name: "", email: "", password: "", role: "pharmacist", department: "Pharmacy" };

export default function Staff() {
  const { isAdmin } = useAuth();
  const { data, loading, refetch } = useFetch(() => authAPI.getUsers(), []);
  const [addOpen,    setAddOpen]    = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const users = data?.users || [];

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authAPI.register(form);
      toast.success("Staff member added!");
      setAddOpen(false);
      setForm(EMPTY_FORM);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add staff");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div>
        <PageHeader title="Staff" subtitle="Manage hospital staff accounts" />
        <div className="card p-10 text-center text-gray-400">
          <p className="text-3xl mb-3">🔒</p>
          <p className="font-medium text-gray-600">Admin access required</p>
          <p className="text-sm mt-1">Only administrators can manage staff accounts.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Staff"
        subtitle={`${users.length} registered accounts`}
        actions={
          <button onClick={() => setAddOpen(true)} className="btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Staff
          </button>
        }
      />

      {loading ? <PageLoader /> : users.length === 0 ? (
        <EmptyState icon="👤" title="No staff yet" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map(u => (
            <div key={u._id} className="card p-5 hover:shadow-card-hover transition-shadow duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {getInitials(u.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{u.name}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Role</span>
                  <span className={`px-2 py-0.5 rounded-full font-medium text-[11px] ${ROLE_COLORS[u.role]}`}>{u.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Department</span>
                  <span className="text-gray-700">{u.department || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Joined</span>
                  <span className="text-gray-700">{formatDate(u.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className={u.isActive ? "pill-ok" : "pill-critical"}>{u.isActive ? "Active" : "Inactive"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Staff Member" size="sm">
        <form onSubmit={handleAdd} className="space-y-4">
          {[["Full name","name","text","Dr. Ananya Sharma"],["Email","email","email","ananya@hospital.com"],["Password","password","password","Min. 6 characters"]].map(([l,k,t,p]) => (
            <div key={k}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
              <input type={t} required placeholder={p} value={form[k]}
                onChange={e => setForm({ ...form, [k]: e.target.value })}
                className="input-base" minLength={k === "password" ? 6 : undefined} />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="input-base">
              <option value="pharmacist">Pharmacist</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
            <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="input-base" placeholder="e.g. Pharmacy, ICU..." />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setAddOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? "Adding..." : "Add Staff"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
