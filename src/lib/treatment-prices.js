// Indicative price list for common dental treatments — used by Calendar
// Appointment's "Cek Harga Treatment" search and to show a "Harga" figure
// on each appointment card. There's no `treatments`/pricing table in
// Supabase yet, so this is a client-side reference list (consistent with
// the same treatment names already used as dummy invoice items in
// Billing.jsx) rather than real billing data — good enough for a
// receptionist to quote a ballpark price, not a source of truth for
// invoicing.
export const TREATMENT_PRICES = [
  { name: 'Konsultasi', price: 100000 },
  { name: 'Registrasi Baru / Konsultasi Awal', price: 100000 },
  { name: 'Kontrol Rutin', price: 150000 },
  { name: 'Kontrol Pasca Cabut', price: 100000 },
  { name: 'Kontrol Behel', price: 150000 },
  { name: 'Kontrol Kawat Gigi', price: 150000 },
  { name: 'Konsultasi Behel', price: 150000 },
  { name: 'Sakit Gigi', price: 150000 },
  { name: 'Sakit Gusi', price: 200000 },
  { name: 'Perawatan Gusi', price: 200000 },
  { name: 'Gigi Ngilu / Sensitive', price: 200000 },
  { name: 'Gigi Sensitif', price: 200000 },
  { name: 'Tambal Gigi', price: 250000 },
  { name: 'Gigi Berlubang', price: 250000 },
  { name: 'Karang Gigi', price: 300000 },
  { name: 'Pembersihan Karang Gigi', price: 300000 },
  { name: 'Cabut Gigi', price: 300000 },
  { name: 'Cabut Gigi Bungsu', price: 750000 },
  { name: 'Gigi Patah', price: 400000 },
  { name: 'Scaling', price: 350000 },
  { name: 'Root Canal', price: 900000 },
  { name: 'Pasang Behel', price: 5000000 },
  { name: 'Veneer Gigi', price: 1750000 },
  { name: 'Whitening Gigi', price: 1500000 },
  { name: 'Whitening', price: 1500000 },
];

// Longest-name-first so a more specific phrase (e.g. "Cabut Gigi Bungsu")
// matches before a shorter substring of it (e.g. "Cabut Gigi").
const SORTED_BY_SPECIFICITY = [...TREATMENT_PRICES].sort((a, b) => b.name.length - a.name.length);

/** Formats a rupiah amount the way the rest of the app already does
 * (Billing.jsx / seeded appointment cards): "Rp250.000", no decimals. */
export function formatRupiah(value) {
  if (value == null) return '-';
  return `Rp${Math.round(value).toLocaleString('id-ID')}`;
}

/** Best-effort price lookup for a free-text `keluhan` string. Tries an
 * exact (case-insensitive) match first, then falls back to whichever known
 * treatment name appears as a substring — since `keluhan` is free text
 * entered across Registration/MakeAppointmentDialog, not a fixed enum.
 * Returns null (rendered as "-") when nothing reasonably matches, rather
 * than guessing a price for an unrelated complaint. */
export function getTreatmentPrice(keluhan) {
  if (!keluhan || keluhan === '-') return null;
  const needle = keluhan.trim().toLowerCase();
  const exact = TREATMENT_PRICES.find((t) => t.name.toLowerCase() === needle);
  if (exact) return exact.price;
  const partial = SORTED_BY_SPECIFICITY.find(
    (t) => needle.includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(needle)
  );
  return partial ? partial.price : null;
}

/** Search helper for the "Cek Harga Treatment" input — matches on
 * substring, case-insensitive, capped so the dropdown stays short. */
export function searchTreatmentPrices(query, limit = 6) {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return TREATMENT_PRICES.filter((t) => t.name.toLowerCase().includes(needle)).slice(0, limit);
}
