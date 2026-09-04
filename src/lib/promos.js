import { TREATMENT_PRICES } from './treatment-prices';

// Small reference promo catalog for the "Add Waiting list" form's harga
// promo case — same idea as Calendar Appointment's decorative "Promo &
// Discount" sidebar cards ("Discount Scaling up to 15%" etc.), just
// structured enough here to actually compute a promo price from a real
// treatment instead of only being a static caption. There's no real
// promotions table in Supabase (same situation as TREATMENT_PRICES), so
// this stays a client-side reference list — good enough for a receptionist
// to quote a promo price, not a source of truth for invoicing.
function priceOf(treatmentName) {
  const found = TREATMENT_PRICES.find((t) => t.name === treatmentName);
  return found ? found.price : null;
}

const RAW_PROMOS = [
  { id: 'promo-scaling-15', label: 'Diskon Scaling 15%', treatment: 'Scaling', discountPercent: 15 },
  { id: 'promo-tambal-10', label: 'Diskon Tambal Gigi 10%', treatment: 'Tambal Gigi', discountPercent: 10 },
  {
    id: 'promo-whitening-20',
    label: 'Diskon Whitening Gigi 20%',
    treatment: 'Whitening Gigi',
    discountPercent: 20,
  },
];

/** Each promo carries both its normal price (looked up from
 * TREATMENT_PRICES) and the discounted price, so the UI can show a
 * strikethrough-normal / promo-price pair without recomputing anything. */
export const PROMOS = RAW_PROMOS.map((promo) => {
  const normalPrice = priceOf(promo.treatment);
  const promoPrice =
    normalPrice != null ? Math.round((normalPrice * (100 - promo.discountPercent)) / 100) : null;
  return { ...promo, normalPrice, promoPrice };
});

export function getPromoById(id) {
  return PROMOS.find((p) => p.id === id) ?? null;
}
