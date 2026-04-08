import { useState, useEffect, useCallback, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { medicineAPI } from "../api/services";
import { PageHeader, SearchInput, EmptyState, PageLoader, ConfirmDialog } from "../components/ui";
import { formatDate, getExpiryLabel, getExpiryPill, getStockPill, formatCurrency, CATEGORIES, TRANSACTION_TYPES } from "../utils/helpers";
import { useDebounce } from "../hooks/useFetch";
import toast from "react-hot-toast";

const EMPTY_FORM = {
  name: "", genericName: "", batchNumber: "", category: "Tablet", type: "Allopathy",
  manufacturerName: "", price: "", quantity: "", unit: "units", lowStockThreshold: 50,
  dosage: "", packSizeLabel: "", expiryDate: "", manufacturingDate: "",
  supplier: { name: "", contact: "" }, storageConditions: "", prescriptionRequired: false, notes: "",
};

/* ── Full-height modal ───────────────────────────────────────── */
function Modal({ open, onClose, title, children, maxW = 640 }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div style={{ position: "relative", background: "#fff", borderRadius: 20, width: "100%", maxWidth: maxW, maxHeight: "90vh", boxShadow: "0 24px 64px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column", animation: "scaleIn 0.2s cubic-bezier(.22,1,.36,1) both" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{title}</div>
          <button onClick={onClose} style={{ border: "none", background: "#f8fafc", color: "#64748b", padding: "6px", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "20px 22px" }}>{children}</div>
      </div>
    </div>
  );
}

/* ── Medicine name search autocomplete ───────────────────────── */
function MedicineSearch({ value, onChange, onSelect }) {
  const [query, setQuery]       = useState(value || "");
  const [results, setResults]   = useState([]);
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const debounced = useDebounce(query, 300);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (!debounced || debounced.length < 2) { setResults([]); return; }
    (async () => {
      setLoading(true);
      try {
        const { data } = await medicineAPI.getAll({ search: debounced, limit: 8 });
        setResults(data.medicines || []);
        if ((data.medicines || []).length > 0) setOpen(true);
      } catch { setResults([]); }
      finally { setLoading(false); }
    })();
  }, [debounced]);

  const pick = (med) => {
    setQuery(med.name); setOpen(false);
    onChange(med.name);
    onSelect(med);
  };

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <div style={{ position: "relative" }}>
        <svg style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" value={query} required
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); if (!e.target.value) { setOpen(false); setResults([]); } }}
          onFocus={() => results.length > 0 && setOpen(true)}
          className="input-base" style={{ paddingLeft: 34, paddingRight: 32 }}
          placeholder="Search existing or type new name..." />
        {loading && (
          <svg style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", animation: "spin 0.8s linear infinite", color: "#00B5AD" }} width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        )}
      </div>
      {open && results.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 6, background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", boxShadow: "0 16px 40px rgba(0,0,0,0.14)", zIndex: 100, overflow: "hidden", animation: "scaleIn 0.15s cubic-bezier(.22,1,.36,1) both" }}>
          <div style={{ padding: "8px 14px 4px", fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid #f8fafc" }}>
            Found in inventory — click to autofill
          </div>
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {results.map(med => (
              <button type="button" key={med._id} onClick={() => pick(med)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", transition: "background 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f0fffe"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#e0f7f6,#b2f0ee)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14 }}>💊</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{med.name}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{[med.manufacturerName, med.category, med.genericName].filter(Boolean).join(" · ")}</div>
                </div>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700, background: med.quantity === 0 ? "#fee2e2" : med.quantity <= med.lowStockThreshold ? "#fef3c7" : "#d1fae5", color: med.quantity === 0 ? "#991b1b" : med.quantity <= med.lowStockThreshold ? "#92400e" : "#065f46", flexShrink: 0 }}>
                  {med.quantity} units
                </span>
              </button>
            ))}
          </div>
          <div style={{ padding: "6px 14px 10px", fontSize: 11, color: "#94a3b8", borderTop: "1px solid #f8fafc" }}>
            💡 Selecting autofills the form — you can still edit fields after
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────── */
export default function Inventory() {
  const { refetchAlerts } = useOutletContext() || {};
  const [medicines,    setMedicines]    = useState([]);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [page,         setPage]         = useState(1);
  const [search,       setSearch]       = useState("");
  const [filterCat,    setFilterCat]    = useState("");
  const [filterExpiry, setFilterExpiry] = useState("");
  const [filterStock,  setFilterStock]  = useState("");
  const [addOpen,      setAddOpen]      = useState(false);
  const [editMed,      setEditMed]      = useState(null);
  const [stockMed,     setStockMed]     = useState(null);
  const [detailMed,    setDetailMed]    = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [stockForm,    setStockForm]    = useState({ transactionType: "received", quantity: "", reason: "" });
  const [submitting,   setSubmitting]   = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  const fetchMeds = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await medicineAPI.getAll({ search: debouncedSearch, category: filterCat, expiryStatus: filterExpiry, stockStatus: filterStock, page, limit: 15 });
      setMedicines(data.medicines);
      setTotal(data.total);
    } catch { toast.error("Failed to load inventory"); }
    finally { setLoading(false); }
  }, [debouncedSearch, filterCat, filterExpiry, filterStock, page]);

  useEffect(() => { fetchMeds(); }, [fetchMeds]);
  useEffect(() => { setPage(1); }, [debouncedSearch, filterCat, filterExpiry, filterStock]);

  // After any mutation, refresh alerts too
  const afterMutation = () => { fetchMeds(); refetchAlerts?.(); };

  const handleAdd = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try { await medicineAPI.create(form); toast.success("Medicine added!"); setAddOpen(false); setForm(EMPTY_FORM); afterMutation(); }
    catch (err) { toast.error(err.response?.data?.message || "Failed to add"); }
    finally { setSubmitting(false); }
  };

  const handleEdit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try { await medicineAPI.update(editMed._id, form); toast.success("Medicine updated!"); setEditMed(null); afterMutation(); }
    catch (err) { toast.error(err.response?.data?.message || "Failed to update"); }
    finally { setSubmitting(false); }
  };

  const handleStock = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await medicineAPI.updateStock(stockMed._id, { ...stockForm, quantity: Number(stockForm.quantity) });
      toast.success("Stock updated!");
      setStockMed(null); setStockForm({ transactionType: "received", quantity: "", reason: "" });
      afterMutation();
    }
    catch (err) { toast.error(err.response?.data?.message || "Failed to update stock"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    try {
      await medicineAPI.delete(deleteTarget._id);
      toast.success("Medicine removed"); setDeleteTarget(null); afterMutation();
    } catch (err) {
      if (err.response?.status === 403) toast.error("Only admins can delete medicines");
      else toast.error("Failed to delete");
    }
  };

  const openEdit = (med) => {
    setForm({ ...EMPTY_FORM, ...med,
      expiryDate: med.expiryDate ? new Date(med.expiryDate).toISOString().split("T")[0] : "",
      manufacturingDate: med.manufacturingDate ? new Date(med.manufacturingDate).toISOString().split("T")[0] : "",
      supplier: med.supplier || { name: "", contact: "" },
    });
    setEditMed(med);
  };

  const handleAutofill = (med) => {
    setForm(f => ({
      ...f,
      name:             med.name            || f.name,
      genericName:      med.genericName     || f.genericName,
      category:         med.category        || f.category,
      manufacturerName: med.manufacturerName|| f.manufacturerName,
      price:            med.price != null ? med.price : f.price,
      packSizeLabel:    med.packSizeLabel   || f.packSizeLabel,
      dosage:           med.dosage          || f.dosage,
      type:             med.type            || f.type,
    }));
  };

  const totalPages = Math.ceil(total / 15);
  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const L = { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 };
  const sectionTitle = (t) => (
    <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ flex: 1, height: 1, background: "#f1f5f9", display: "inline-block" }}/>{t}<span style={{ flex: 1, height: 1, background: "#f1f5f9", display: "inline-block" }}/>
    </div>
  );

  return (
    <div>
      <PageHeader title="Inventory" subtitle={`${total.toLocaleString()} medicines tracked`}
        actions={
          <button onClick={() => { setForm(EMPTY_FORM); setAddOpen(true); }} className="btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Medicine
          </button>
        }
      />

      {/* Filters */}
      <div className="filter-bar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, batch, manufacturer..." />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="input-base" style={{ width: "auto" }}>
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterExpiry} onChange={e => setFilterExpiry(e.target.value)} className="input-base" style={{ width: "auto" }}>
          <option value="">All expiry</option>
          <option value="expired">Expired</option>
          <option value="critical">Critical (≤7 days)</option>
          <option value="warning">Warning (≤30 days)</option>
        </select>
        <select value={filterStock} onChange={e => setFilterStock(e.target.value)} className="input-base" style={{ width: "auto" }}>
          <option value="">All stock</option>
          <option value="low">Low stock</option>
          <option value="out_of_stock">Out of stock</option>
        </select>
        {(filterCat || filterExpiry || filterStock || search) && (
          <button onClick={() => { setSearch(""); setFilterCat(""); setFilterExpiry(""); setFilterStock(""); }} className="btn-secondary" style={{ fontSize: 12 }}>Clear ✕</button>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}><PageLoader /></div>
        ) : medicines.length === 0 ? (
          <EmptyState icon="💊" title="No medicines found" subtitle="Try adjusting your search or filters" />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="tm-table">
              <thead>
                <tr><th>Medicine</th><th>Batch</th><th>Category</th><th>Qty</th><th>Expiry</th><th>Stock</th><th>Price</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {medicines.map((med) => {
                  const ep = getExpiryPill(med.expiryDate);
                  const sp = getStockPill(med.quantity, med.lowStockThreshold);
                  return (
                    <tr key={med._id} style={{ cursor: "pointer" }} onClick={() => setDetailMed(med)}>
                      <td><p style={{ fontWeight: 600, color: "#0f172a", fontSize: 13 }}>{med.name}</p>{med.genericName && <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{med.genericName}</p>}</td>
                      <td><span style={{ fontFamily: "monospace", fontSize: 12, color: "#64748b" }}>{med.batchNumber}</span></td>
                      <td><span className="pill-gray">{med.category}</span></td>
                      <td><span style={{ fontWeight: 700, color: "#0f172a" }}>{med.quantity}</span><span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 3 }}>{med.unit}</span></td>
                      <td><span className={ep.cls}>{getExpiryLabel(med.expiryDate)}</span></td>
                      <td><span className={sp.cls}>{sp.label}</span></td>
                      <td style={{ fontFamily: "monospace", fontSize: 12, color: "#64748b" }}>{formatCurrency(med.price)}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: 4 }}>
                          {[
                            { icon: "M23 4l-6 0 0 6M20.49 15a9 9 0 1 1-2.12-9.36L23 10", title: "Update stock", color: "#00B5AD", bg: "#e0f7f6", fn: () => setStockMed(med) },
                            { icon: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7|M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z", title: "Edit", color: "#6366f1", bg: "#eef2ff", fn: () => openEdit(med) },
                            { icon: "M3 6h18|M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2", title: "Delete", color: "#ef4444", bg: "#fee2e2", fn: () => setDeleteTarget(med) },
                          ].map(({ icon, title, color, bg, fn }) => (
                            <button key={title} onClick={fn} title={title}
                              style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                              onMouseEnter={e => { e.currentTarget.style.background = bg; e.currentTarget.style.color = color; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                {icon.split("|").map((d, i) => d.startsWith("M") ? <path key={i} d={d}/> : <polyline key={i} points={d}/>)}
                              </svg>
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>Page {page} of {totalPages} · {total} total</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary" style={{ fontSize: 12, padding: "5px 12px", opacity: page === 1 ? 0.4 : 1 }}>← Prev</button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary" style={{ fontSize: 12, padding: "5px 12px", opacity: page === totalPages ? 0.4 : 1 }}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={addOpen || !!editMed} onClose={() => { setAddOpen(false); setEditMed(null); }} title={editMed ? "Edit Medicine" : "Add New Medicine"}>
        <form onSubmit={editMed ? handleEdit : handleAdd} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {sectionTitle("Medicine Identity")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={L}>Medicine name * {!editMed && <span style={{ color: "#00B5AD", fontWeight: 400, fontSize: 11 }}>— search existing or type new</span>}</label>
              {editMed
                ? <input required value={form.name} onChange={e => F("name", e.target.value)} className="input-base" placeholder="e.g. Paracetamol 500mg" />
                : <MedicineSearch value={form.name} onChange={v => F("name", v)} onSelect={handleAutofill} />
              }
            </div>
            <div><label style={L}>Generic name</label><input value={form.genericName} onChange={e => F("genericName", e.target.value)} className="input-base" placeholder="Active ingredient" /></div>
            <div><label style={L}>Batch number *</label><input required value={form.batchNumber} onChange={e => F("batchNumber", e.target.value)} className="input-base" placeholder="e.g. MX2034" /></div>
            <div><label style={L}>Category</label><select value={form.category} onChange={e => F("category", e.target.value)} className="input-base">{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
            <div><label style={L}>Manufacturer</label><input value={form.manufacturerName} onChange={e => F("manufacturerName", e.target.value)} className="input-base" placeholder="Manufacturer name" /></div>
          </div>
          {sectionTitle("Stock & Pricing")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={L}>Opening quantity *</label><input required type="number" min="0" value={form.quantity} onChange={e => F("quantity", e.target.value)} className="input-base" /></div>
            <div><label style={L}>Low stock threshold</label><input type="number" min="0" value={form.lowStockThreshold} onChange={e => F("lowStockThreshold", e.target.value)} className="input-base" /></div>
            <div><label style={L}>Price (₹)</label><input type="number" min="0" step="0.01" value={form.price} onChange={e => F("price", e.target.value)} className="input-base" /></div>
            <div><label style={L}>Dosage</label><input value={form.dosage} onChange={e => F("dosage", e.target.value)} className="input-base" placeholder="e.g. 500mg" /></div>
          </div>
          {sectionTitle("Dates")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={L}>Expiry date *</label><input required type="date" value={form.expiryDate} onChange={e => F("expiryDate", e.target.value)} className="input-base" /></div>
            <div><label style={L}>Manufacturing date</label><input type="date" value={form.manufacturingDate} onChange={e => F("manufacturingDate", e.target.value)} className="input-base" /></div>
          </div>
          {sectionTitle("Additional")}
          <div><label style={L}>Pack size</label><input value={form.packSizeLabel} onChange={e => F("packSizeLabel", e.target.value)} className="input-base" placeholder="e.g. Strip of 10 tablets" /></div>
          <div><label style={L}>Notes / Storage</label><textarea rows={2} value={form.notes} onChange={e => F("notes", e.target.value)} className="input-base" style={{ resize: "none" }} placeholder="e.g. Store below 25°C..." /></div>

          <div style={{ display: "flex", gap: 10, paddingTop: 4, borderTop: "1px solid #f1f5f9", position: "sticky", bottom: 0, background: "#fff", paddingBottom: 2 }}>
            <button type="button" onClick={() => { setAddOpen(false); setEditMed(null); }} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 1 }}>
              {submitting ? "Saving..." : editMed ? "Save Changes" : "Add Medicine"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock update */}
      <Modal open={!!stockMed} onClose={() => setStockMed(null)} title={`Update Stock — ${stockMed?.name}`} maxW={400}>
        <form onSubmit={handleStock} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "linear-gradient(135deg,#e0f7f6,#f0fffe)", borderRadius: 12, border: "1px solid #b2f0ee" }}>
            <span style={{ fontSize: 13, color: "#00857f", fontWeight: 600 }}>Current stock</span>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 800, color: "#00857f" }}>{stockMed?.quantity} <span style={{ fontSize: 12, fontWeight: 400 }}>{stockMed?.unit}</span></span>
          </div>
          <div><label style={L}>Transaction type</label>
            <select value={stockForm.transactionType} onChange={e => setStockForm({ ...stockForm, transactionType: e.target.value })} className="input-base">
              {TRANSACTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div><label style={L}>Quantity {stockForm.transactionType === "adjusted" ? "(set new total)" : ""}</label>
            <input type="number" min="1" required value={stockForm.quantity} onChange={e => setStockForm({ ...stockForm, quantity: e.target.value })} className="input-base" placeholder="Enter quantity" />
          </div>
          <div><label style={L}>Reason (optional)</label>
            <input type="text" value={stockForm.reason} onChange={e => setStockForm({ ...stockForm, reason: e.target.value })} className="input-base" placeholder="e.g. Patient dispensing..." />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={() => setStockMed(null)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 1 }}>{submitting ? "Saving..." : "Update Stock"}</button>
          </div>
        </form>
      </Modal>

      {/* Detail modal */}
      <Modal open={!!detailMed} onClose={() => setDetailMed(null)} title="Medicine Details">
        {detailMed && (
          <div>
            <div style={{ display: "flex", gap: 14, padding: "14px 16px", background: "linear-gradient(135deg,#f0fffe,#f8faff)", borderRadius: 14, marginBottom: 18, border: "1px solid #e0f7f6" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#00C5BC,#007f7b)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>💊</div>
              <div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 15 }}>{detailMed.name}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{detailMed.genericName || "—"} · {detailMed.category}</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                ["Batch",        detailMed.batchNumber],
                ["Manufacturer", detailMed.manufacturerName || "—"],
                ["Price",        formatCurrency(detailMed.price)],
                ["Quantity",     `${detailMed.quantity} ${detailMed.unit}`],
                ["Low Stock At", `≤ ${detailMed.lowStockThreshold}`],
                ["Expiry",       formatDate(detailMed.expiryDate)],
                ["Mfg Date",     formatDate(detailMed.manufacturingDate)],
                ["Pack Size",    detailMed.packSizeLabel || "—"],
                ["Dosage",       detailMed.dosage || "—"],
                ["Type",         detailMed.type || "—"],
              ].map(([k, v]) => (
                <div key={k} style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{k}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{v}</div>
                </div>
              ))}
            </div>
            {detailMed.notes && <div style={{ marginTop: 14, padding: "12px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, fontSize: 13, color: "#92400e" }}>📝 {detailMed.notes}</div>}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Remove medicine?" message={`"${deleteTarget?.name}" will be removed from inventory.`} confirmLabel="Remove" danger />
    </div>
  );
}
