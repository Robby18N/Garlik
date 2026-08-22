import { supabase } from './supabase';

// Every patient row needs a unique, human-readable MRN ("P-0001", "P-0002",
// ...) — the schema has no default/sequence for it (mrn is a free-form
// unique text column, not tied to the auto id), so the app has to generate
// one itself before inserting a new patient. Simplest reliable approach for
// a single-clinic, single-writer app: count existing patients and use
// count + 1 as the next number. There's a small theoretical race if two
// registrations are saved at the exact same instant (both could compute the
// same next number) — acceptable for this app's scale; the unique
// constraint on `mrn` means a collision fails loudly (insert error) instead
// of silently overwriting anyone, so the receptionist would just see an
// error toast and could save again.
export async function generateNextMrn() {
  const { count, error } = await supabase
    .from('patients')
    .select('id', { count: 'exact', head: true });
  if (error) throw error;
  const next = (count ?? 0) + 1;
  return `P-${String(next).padStart(4, '0')}`;
}

// Escapes Postgres ILIKE wildcard characters in user-typed search text so a
// literal "%" or "_" someone types doesn't act as a wildcard.
export function escapeIlike(value) {
  return value.replace(/[%_]/g, '\\$&');
}
