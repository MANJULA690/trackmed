import { format, formatDistanceToNow, differenceInDays } from "date-fns";

export const formatDate = (date) => {
  if (!date) return "—";
  return format(new Date(date), "dd MMM yyyy");
};

export const formatDateTime = (date) => {
  if (!date) return "—";
  return format(new Date(date), "dd MMM yyyy, h:mm a");
};

export const timeAgo = (date) => {
  if (!date) return "—";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const daysUntilExpiry = (expiryDate) => {
  if (!expiryDate) return null;
  return differenceInDays(new Date(expiryDate), new Date());
};

export const getExpiryStatus = (expiryDate) => {
  const days = daysUntilExpiry(expiryDate);
  if (days === null) return "unknown";
  if (days < 0)    return "expired";
  if (days <= 7)   return "critical";
  if (days <= 30)  return "warning";
  return "ok";
};

export const getExpiryLabel = (expiryDate) => {
  const days = daysUntilExpiry(expiryDate);
  if (days === null) return "Unknown";
  if (days < 0)    return `Expired ${Math.abs(days)}d ago`;
  if (days === 0)  return "Expires today!";
  if (days <= 30)  return `${days} days left`;
  return formatDate(expiryDate);
};

export const getStockStatus = (quantity, threshold) => {
  if (quantity === 0) return "out_of_stock";
  if (quantity <= threshold) return "low";
  return "ok";
};

export const getStockPill = (quantity, threshold) => {
  const status = getStockStatus(quantity, threshold);
  if (status === "out_of_stock") return { label: "Out of stock", cls: "pill-critical" };
  if (status === "low")          return { label: "Low stock",    cls: "pill-low" };
  return                                { label: "In stock",     cls: "pill-ok" };
};

export const getExpiryPill = (expiryDate) => {
  const status = getExpiryStatus(expiryDate);
  if (status === "expired")  return { label: "Expired",   cls: "pill-critical" };
  if (status === "critical") return { label: "Critical",  cls: "pill-critical" };
  if (status === "warning")  return { label: "Expiring",  cls: "pill-low" };
  return                            { label: "OK",         cls: "pill-ok" };
};

export const getSeverityPill = (severity) => {
  if (severity === "critical") return "pill-critical";
  if (severity === "warning")  return "pill-low";
  return "pill-info";
};

export const formatCurrency = (val) =>
  `₹${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export const getInitials = (name = "") =>
  name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

export const CATEGORIES = [
  "Tablet","Capsule","Syrup","Injection","Cream","Ointment","Drops","Inhaler","Powder","Other"
];

export const TRANSACTION_TYPES = [
  { value: "received",  label: "Received from supplier" },
  { value: "issued",    label: "Issued to patient/ward" },
  { value: "adjusted",  label: "Manual adjustment" },
  { value: "disposed",  label: "Disposed (expired/damaged)" },
  { value: "returned",  label: "Returned by patient" },
];
