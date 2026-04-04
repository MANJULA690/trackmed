import { useState, useEffect, useCallback } from "react";
import { medicineAPI } from "../api/services";
import { PageHeader, SearchInput, Modal, EmptyState, PageLoader, ConfirmDialog } from "../components/ui";
import { formatDate, getExpiryLabel, getExpiryPill, getStockPill, formatCurrency, CATEGORIES, TRANSACTION_TYPES } from "../utils/helpers";
import { useDebounce } from "../hooks/useFetch";
import toast from "react-hot-toast";

const EMPTY_FORM = {
  name: "", genericName: "", batchNumber: "", category: "Tablet", type: "Allopathy",
  manufacturerName: "", price: "", quantity: "", unit: "units", lowStockThreshold: 50,
  dosage: "", packSizeLabel: "", expiryDate: "", manufacturingDate: "",
  supplier: { name: "", contact: "" }, storageConditions: "", prescriptionRequired: false, notes: "",
};

export default function Inventory() {
  const [medicines, setMedicines] = useState([]);
  const [total,    setTotal]      = useState(0);
  const [loading,  setLoading]    = useState(true);
  const [page,     setPage]       = useState(1);

  // Filters
  const [search,       setSearch]       = useState("");
  const [filterCat,    setFilterCat]    = useState("");
  const [filterExpiry, setFilterExpiry] = useState("");
  const [filterStock,  setFilterStock]  = useState("");

  // Modals
  const [addOpen,      setAddOpen]      = useState(false);
  const [editMed,      setEditMed]      = useState(null);
  const [stockMed,     setStockMed]     = useState(null);
  const [detailMed,    setDetailMed]    = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Forms
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [stockForm,   setStockForm]   = useState({ transactionType: "received", quantity: "", reason: "" });
  const [submitting,  setSubmitting]  = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const fetchMedicines = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await medicineAPI.getAll({
        search: debouncedSearch, category: filterCat,
        expiryStatus: filterExpiry, stockStatus: filterStock,
        page, limit: 15,
      });
      setMedicines(data.medicines);
      setTotal(data.total);
    } catch {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filterCat, filterExpiry, filterStock, page]);

  useEffect(() => { fetchMedicines(); }, [fetchMedicines]);
  useEffect(() => { setPage(1); }, [debouncedSearch, filterCat, filterExpiry, filterStock]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await medicineAPI.create(form);
      toast.success("Medicine added successfully!");
      setAddOpen(false);
      setForm(EMPTY_FORM);
      fetchMedicines();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add medicine");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await medicineAPI.update(editMed._id, form);
      toast.success("Medicine updated!");
      setEditMed(null);
      fetchMedicines();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await medicineAPI.updateStock(stockMed._id, {
        ...stockForm,
        quantity: Number(stockForm.quantity),
      });
      toast.success("Stock updated!");
      setStockMed(null);
      setStockForm({ transactionType: "received", quantity: "", reason: "" });
      fetchMedicines();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update stock");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await medicineAPI.delete(deleteTarget._id);
      toast.success("Medicine removed");
      setDeleteTarget(null);
      fetchMedicines();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const openEdit = (med) => {
    setForm({
      ...EMPTY_FORM, ...med,
      expiryDate: med.expiryDate ? new Date(med.expiryDate).toISOString().split("T")[0] : "",
      manufacturingDate: med.manufacturingDate ? new Date(med.manufacturingDate).toISOString().split("T")[0] : "",
      supplier: med.supplier || { name: "", contact: "" },
    });
    setEditMed(med);
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle={`${total.toLocaleString()} medicines tracked`}
        actions={
          <button onClick={() => { setForm(EMPTY_FORM); setAddOpen(true); }} className="btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Medicine
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2.5 mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, batch, manufacturer..." />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="input-base w-auto pr-8">
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterExpiry} onChange={e => setFilterExpiry(e.target.value)} className="input-base w-auto pr-8">
          <option value="">All expiry</option>
          <option value="expired">Expired</option>
          <option value="critical">Critical (≤7 days)</option>
          <option value="warning">Warning (≤30 days)</option>
        </select>
        <select value={filterStock} onChange={e => setFilterStock(e.target.value)} className="input-base w-auto pr-8">
          <option value="">All stock</option>
          <option value="low">Low stock</option>
          <option value="out_of_stock">Out of stock</option>
        </select>
        {(filterCat || filterExpiry || filterStock || search) && (
          <button onClick={() => { setSearch(""); setFilterCat(""); setFilterExpiry(""); setFilterStock(""); }} className="btn-secondary text-xs">
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><PageLoader /></div>
        ) : medicines.length === 0 ? (
          <EmptyState icon="💊" title="No medicines found" subtitle="Try adjusting your search or filters" />
        ) : (
          <div className="overflow-x-auto">
            <table className="tm-table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Batch</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>Expiry</th>
                  <th>Stock</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((med) => {
                  const ep = getExpiryPill(med.expiryDate);
                  const sp = getStockPill(med.quantity, med.lowStockThreshold);
                  return (
                    <tr key={med._id} className="cursor-pointer" onClick={() => setDetailMed(med)}>
                      <td>
                        <p className="font-medium text-gray-900 text-sm">{med.name}</p>
                        {med.genericName && <p className="text-xs text-gray-400 mt-0.5">{med.genericName}</p>}
                      </td>
                      <td><span className="font-mono text-xs text-gray-500">{med.batchNumber}</span></td>
                      <td><span className="pill-gray">{med.category}</span></td>
                      <td>
                        <span className="font-medium text-gray-800">{med.quantity}</span>
                        <span className="text-gray-400 text-xs ml-1">{med.unit}</span>
                      </td>
                      <td>
                        <span className={ep.cls}>{getExpiryLabel(med.expiryDate)}</span>
                      </td>
                      <td><span className={sp.cls}>{sp.label}</span></td>
                      <td className="text-gray-600 font-mono text-xs">{formatCurrency(med.price)}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setStockMed(med)} className="p-1.5 text-gray-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors" title="Update stock">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                          </button>
                          <button onClick={() => openEdit(med)} className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button onClick={() => setDeleteTarget(med)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">Page {page} of {totalPages} · {total} total</p>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-xs py-1 px-2.5 disabled:opacity-40">← Prev</button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-xs py-1 px-2.5 disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Medicine Modal */}
      <Modal open={addOpen || !!editMed} onClose={() => { setAddOpen(false); setEditMed(null); }}
             title={editMed ? "Edit Medicine" : "Add New Medicine"} size="lg">
        <MedicineForm form={form} setForm={setForm} onSubmit={editMed ? handleEdit : handleAdd} submitting={submitting}
                      onCancel={() => { setAddOpen(false); setEditMed(null); }} isEdit={!!editMed} />
      </Modal>

      {/* Stock Update Modal */}
      <Modal open={!!stockMed} onClose={() => setStockMed(null)} title={`Update Stock — ${stockMed?.name}`} size="sm">
        <form onSubmit={handleStockUpdate} className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-3">
              <span className="text-gray-500">Current stock</span>
              <span className="font-medium text-gray-900">{stockMed?.quantity} {stockMed?.unit}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Transaction type</label>
            <select value={stockForm.transactionType} onChange={e => setStockForm({ ...stockForm, transactionType: e.target.value })} className="input-base">
              {TRANSACTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Quantity {stockForm.transactionType === "adjusted" ? "(new total)" : ""}
            </label>
            <input type="number" min="1" required value={stockForm.quantity}
              onChange={e => setStockForm({ ...stockForm, quantity: e.target.value })}
              className="input-base" placeholder="Enter quantity" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Reason</label>
            <input type="text" value={stockForm.reason}
              onChange={e => setStockForm({ ...stockForm, reason: e.target.value })}
              className="input-base" placeholder="e.g. Patient dispensing, Supplier delivery..." />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setStockMed(null)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? "Saving..." : "Update Stock"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      {detailMed && (
        <Modal open={!!detailMed} onClose={() => setDetailMed(null)} title="Medicine Details" size="md">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Name", detailMed.name], ["Generic Name", detailMed.genericName || "—"],
                ["Batch", detailMed.batchNumber], ["Category", detailMed.category],
                ["Manufacturer", detailMed.manufacturerName || "—"], ["Price", formatCurrency(detailMed.price)],
                ["Quantity", `${detailMed.quantity} ${detailMed.unit}`], ["Low Stock Alert", `≤ ${detailMed.lowStockThreshold}`],
                ["Expiry Date", formatDate(detailMed.expiryDate)], ["Mfg Date", formatDate(detailMed.manufacturingDate)],
                ["Pack Size", detailMed.packSizeLabel || "—"], ["Dosage", detailMed.dosage || "—"],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-gray-400">{k}</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{v}</p>
                </div>
              ))}
            </div>
            {detailMed.notes && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">{detailMed.notes}</div>
            )}
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Remove medicine?" message={`This will remove "${deleteTarget?.name}" from inventory. This action cannot be undone.`}
        confirmLabel="Remove" danger />
    </div>
  );
}

function MedicineForm({ form, setForm, onSubmit, submitting, onCancel, isEdit }) {
  const F = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const labelCls = "block text-xs font-medium text-gray-600 mb-1";
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={labelCls}>Medicine name *</label>
          <input required value={form.name} onChange={e => F("name", e.target.value)} className="input-base" placeholder="e.g. Paracetamol 500mg" />
        </div>
        <div>
          <label className={labelCls}>Generic name</label>
          <input value={form.genericName} onChange={e => F("genericName", e.target.value)} className="input-base" placeholder="Active ingredient" />
        </div>
        <div>
          <label className={labelCls}>Batch number *</label>
          <input required value={form.batchNumber} onChange={e => F("batchNumber", e.target.value)} className="input-base" placeholder="e.g. MX2034" />
        </div>
        <div>
          <label className={labelCls}>Category</label>
          <select value={form.category} onChange={e => F("category", e.target.value)} className="input-base">
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Manufacturer</label>
          <input value={form.manufacturerName} onChange={e => F("manufacturerName", e.target.value)} className="input-base" placeholder="Manufacturer name" />
        </div>
        <div>
          <label className={labelCls}>Quantity *</label>
          <input required type="number" min="0" value={form.quantity} onChange={e => F("quantity", e.target.value)} className="input-base" />
        </div>
        <div>
          <label className={labelCls}>Low stock threshold</label>
          <input type="number" min="0" value={form.lowStockThreshold} onChange={e => F("lowStockThreshold", e.target.value)} className="input-base" />
        </div>
        <div>
          <label className={labelCls}>Expiry date *</label>
          <input required type="date" value={form.expiryDate} onChange={e => F("expiryDate", e.target.value)} className="input-base" />
        </div>
        <div>
          <label className={labelCls}>Manufacturing date</label>
          <input type="date" value={form.manufacturingDate} onChange={e => F("manufacturingDate", e.target.value)} className="input-base" />
        </div>
        <div>
          <label className={labelCls}>Price (₹)</label>
          <input type="number" min="0" step="0.01" value={form.price} onChange={e => F("price", e.target.value)} className="input-base" />
        </div>
        <div>
          <label className={labelCls}>Dosage</label>
          <input value={form.dosage} onChange={e => F("dosage", e.target.value)} className="input-base" placeholder="e.g. 500mg" />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Pack size label</label>
          <input value={form.packSizeLabel} onChange={e => F("packSizeLabel", e.target.value)} className="input-base" placeholder="e.g. Strip of 10 tablets" />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Notes</label>
          <textarea rows={2} value={form.notes} onChange={e => F("notes", e.target.value)} className="input-base resize-none" placeholder="Storage conditions, special instructions..." />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={submitting} className="btn-primary flex-1">
          {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Medicine"}
        </button>
      </div>
    </form>
  );
}
