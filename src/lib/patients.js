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

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Converts a Supabase `date` column (plain "2026-08-10" string, no time/TZ
// component) into the short human-readable label used across the app
// ("10 Aug 2026"). The literal "T00:00:00" anchors the parse to local
// midnight rather than UTC midnight, so it can't roll back a day in
// negative-UTC-offset timezones.
export function formatDisplayDate(isoDate) {
  if (!isoDate) return null;
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${parsed.getDate()} ${MONTH_NAMES[parsed.getMonth()]} ${parsed.getFullYear()}`;
}

// Finds a patient's most recent genuine past visit (an appointment dated
// today-or-earlier that wasn't Cancelled — a cancelled slot never actually
// happened) — used by PatientFoundDialog ("Patient search results") to
// give the receptionist/doctor a quick heads-up on this patient's history
// before booking a new appointment for them. Returns null when the patient
// has no real visit on record yet.
export async function fetchLastVisit(patientId) {
  const { data, error } = await supabase
    .from('appointments')
    .select('appt_date, keluhan, status')
    .eq('patient_id', patientId)
    .order('appt_date', { ascending: false });

  if (error) {
    console.error('Failed to load last visit for patient', patientId, error);
    return null;
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const lastReal = (data ?? []).find(
    (a) => a.appt_date && a.appt_date <= todayStr && a.status !== 'Cancel'
  );
  if (!lastReal) return null;

  return {
    date: formatDisplayDate(lastReal.appt_date),
    treatment: lastReal.keluhan && lastReal.keluhan !== '-' ? lastReal.keluhan : null,
  };
}
