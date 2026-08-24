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

// Single source of truth for "what counts as a real visit", given one
// patient's raw appointment rows (any order): an appointment dated
// today-or-earlier that wasn't Cancelled — a cancelled slot never actually
// happened — is a past visit; anything dated after today is an upcoming
// appointment. Pure/sync (no fetching) so it can be reused both by code
// that already has the rows in hand (Records.jsx bulk-fetches once for
// every patient at once) and by fetchPatientVisits below (fetches one
// patient at a time). Before this was pulled out, PatientFoundDialog's
// last-visit line, Records' History tab, and Today's Patient's own Detail
// Pasien sheet each risked re-deriving this slightly differently — exactly
// what happened when Today's Patient's sheet was never wired up at all and
// silently showed "No visit history available" for everyone.
export function summarizeVisits(appointmentRows) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const past = (appointmentRows ?? [])
    .filter((a) => a.appt_date && a.appt_date <= todayStr && a.status !== 'Cancel')
    .sort((a, b) => (a.appt_date < b.appt_date ? 1 : a.appt_date > b.appt_date ? -1 : 0));
  const future = (appointmentRows ?? [])
    .filter((a) => a.appt_date && a.appt_date > todayStr)
    .sort((a, b) => (a.appt_date < b.appt_date ? -1 : a.appt_date > b.appt_date ? 1 : 0));

  return {
    visitHistory: past.map((a) => ({
      date: formatDisplayDate(a.appt_date),
      doctor: a.dokter && a.dokter !== '-' ? a.dokter : undefined,
      treatment: a.keluhan && a.keluhan !== '-' ? a.keluhan : undefined,
    })),
    lastVisit: past[0] ? formatDisplayDate(past[0].appt_date) : null,
    totalVisits: past.length,
    appointments: future.map((a) => ({
      reason: a.keluhan && a.keluhan !== '-' ? a.keluhan : 'Appointment',
      doctor: a.dokter && a.dokter !== '-' ? a.dokter : undefined,
      date: formatDisplayDate(a.appt_date),
    })),
  };
}

// Fetches one patient's full visit picture (visitHistory, lastVisit,
// totalVisits, upcoming appointments) — used by Today's Patient's Detail
// Pasien sheet (handleViewPatient in TodaysPatient.jsx), fetched on demand
// for just the one patient being viewed rather than bulk-loading every
// patient's history up front like Records.jsx does.
export async function fetchPatientVisits(patientId) {
  const { data, error } = await supabase
    .from('appointments')
    .select('appt_date, dokter, keluhan, status')
    .eq('patient_id', patientId);

  if (error) {
    console.error('Failed to load visit history for patient', patientId, error);
    return { visitHistory: [], lastVisit: null, totalVisits: 0, appointments: [] };
  }

  return summarizeVisits(data);
}

// Finds a patient's most recent genuine past visit — used by
// PatientFoundDialog ("Patient search results") to give the
// receptionist/doctor a quick heads-up on this patient's history before
// booking a new appointment for them. Returns null when the patient has no
// real visit on record yet. A thin wrapper over fetchPatientVisits so this
// and the Detail Pasien sheet can never disagree on what counts as "last".
export async function fetchLastVisit(patientId) {
  const { visitHistory } = await fetchPatientVisits(patientId);
  const last = visitHistory[0];
  return last ? { date: last.date, treatment: last.treatment ?? null } : null;
}
