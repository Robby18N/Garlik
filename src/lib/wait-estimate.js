// Queue-based estimated wait time for patients in the "waiting to be seen"
// family of statuses (WL / Waiting 10 Min / Waiting 20 Min / Late — see
// TodaysPatient's STATUS_STYLES). This is deliberately an ESTIMATE, not a
// promise: it's built entirely from planned durations (the `durasi` field,
// e.g. "60 Min") and, where available, when the doctor's current patient
// actually started — it has no way to know a treatment is running long
// until someone still hasn't moved that patient to "Complete".

// "WL" has no numeric prefix (it's the neutral just-arrived status — see
// TodaysPatient's STATUS_STYLES), everything else in the family reads
// "Waiting <n> Min". Exported so summary-cards.jsx can share this instead
// of keeping its own copy that could drift out of sync.
export function isWaitingStatus(status) {
  return typeof status === 'string' && (status === 'WL' || status.startsWith('Waiting'));
}

// `durasi` is stored as free text like "60 Min" (see DURATIONS in
// make-appointment-dialog.jsx / edit-appointment-dialog.jsx) rather than a
// clean number — parse out the leading digits, defaulting to 0 for
// anything unexpected (e.g. the "-" placeholder an unset appointment
// starts with) so a bad value degrades the estimate instead of breaking it.
export function parseDurationMinutes(durasi) {
  const match = typeof durasi === 'string' ? durasi.match(/\d+/) : null;
  return match ? parseInt(match[0], 10) : 0;
}

/**
 * Computes an estimated wait (in minutes) for every patient in `roster`
 * who's still waiting to be seen, per doctor. `roster` is one day's
 * appointments (already status-resolved — merge in any ephemeral
 * statusOverrides before calling this) with at least
 * { id, dokter, appt (HH:MM), durasi, status, startedAt (ISO string|null) }.
 * `nowMs` is passed in (not read internally via Date.now()) so callers
 * control exactly when this recomputes — e.g. a ticking interval for a
 * live-updating display.
 *
 * Logic per doctor (assumes one doctor treats one patient at a time, which
 * matches the app's single "In Treatment" status per appointment):
 *   1. Find that doctor's currently "In Treatment" appointment, if any.
 *      Its remaining time is (planned duration − elapsed since startedAt),
 *      floored at 0 for an overrunning treatment — never negative, and an
 *      overrun otherwise just means everyone behind is more delayed than
 *      estimated until that patient is actually marked Complete. No
 *      startedAt recorded yet (e.g. before the started_at column existed,
 *      or a page that predates this feature) means "unknown" — treated as
 *      0 rather than blocking the whole chain, so the estimate still works
 *      for those behind it, just undercounts this one gap.
 *   2. Walk the doctor's roster in appointment-time order. Each waiting
 *      patient's estimate is the running total so far; their own planned
 *      duration is then added to that running total before moving to the
 *      next patient, so the queue cascades. Complete/Cancel patients are
 *      skipped entirely (already resolved, not occupying any of the
 *      doctor's remaining time).
 *
 * Returns a Map<patientId, { minutes, label }> — only patients an estimate
 * was actually computed for are present; check `.has(id)` before use.
 */
export function computeWaitEstimates(roster, nowMs) {
  const estimates = new Map();
  const byDoctor = new Map();
  for (const p of roster) {
    const key = p.dokter || '';
    if (!byDoctor.has(key)) byDoctor.set(key, []);
    byDoctor.get(key).push(p);
  }

  for (const patients of byDoctor.values()) {
    const sorted = [...patients].sort((a, b) => (a.appt || '').localeCompare(b.appt || ''));

    const inTreatment = sorted.find((p) => p.status === 'In Treatment');
    let cursor = 0;
    if (inTreatment) {
      const planned = parseDurationMinutes(inTreatment.durasi);
      if (inTreatment.startedAt) {
        const elapsedMinutes = (nowMs - new Date(inTreatment.startedAt).getTime()) / 60000;
        cursor = Math.max(0, planned - elapsedMinutes);
      }
      // No startedAt recorded — leave cursor at 0 (see doc comment above).
    }

    for (const p of sorted) {
      if (p.status === 'Complete' || p.status === 'Cancel' || p.status === 'In Treatment') continue;
      if (!isWaitingStatus(p.status) && p.status !== 'Late') continue;

      const minutes = Math.round(cursor);
      estimates.set(p.id, {
        minutes,
        label: minutes <= 0 ? 'Segera dipanggil' : `~${minutes} menit lagi`,
      });
      cursor += parseDurationMinutes(p.durasi);
    }
  }

  return estimates;
}
