import { useMemo, useState } from 'react';
import { NotebookPen, UsersRound, Users, Stethoscope, Plus, X } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { StatCard, DetailHighlightToggle } from '@/components/stat-card';
import { isWaitingStatus } from '@/lib/wait-estimate';
// The clinic's fixed roster of doctors — same source Registration.jsx's
// appointment-doctor picker and the login screen's account list use, so
// "Doctor Available" can never list a doctor that doesn't actually exist
// in the system (or miss one that does).
import { DOCTORS } from '@/context/role-context';

// Mock data matching the Figma "Summary show & hide" component exactly
// (Show state: node 583:4311, Hide state: node 583:4583).
const DEFAULT_STICKY_NOTES = ['Lantai Licin', 'Ada Lalat', 'Toilet'];

// The four Status Patient buckets, matched against a real patient list
// (Today's Patient's status field) — used for both the doctor-scoped
// variant (that doctor's own roster) and the Receptionist/Admin variant
// (the full today's roster). This used to be a fixed mock (STATUS_BREAKDOWN,
// 19/1/2/2) shown only for Receptionist/Admin — a leftover from before the
// Supabase migration that never got wired up, so it silently never matched
// what the table below it actually showed.
//
// isWaitingStatus lives in lib/wait-estimate.js (shared with TodaysPatient's
// live wait-time estimate) so "Dalam Antrean" counting as part of the
// "Waiting" family can't drift between the two places that need to agree on it.

const STATUS_BUCKETS = [
  { label: 'Waiting', dot: 'bg-orange-500', match: isWaitingStatus },
  { label: 'Complete', dot: 'bg-green-500', match: (s) => s === 'Complete' },
  { label: 'Late', dot: 'bg-purple-500', match: (s) => s === 'Late' },
  { label: 'Cancel', dot: 'bg-red-500', match: (s) => s === 'Cancel' },
];

// The clinic's operating window used to work out each doctor's *free*
// gaps today (08:00-17:00) — appointments in this app have never been
// seen outside that range, and there's no "clinic hours" setting anywhere
// else in the app to read this from instead.
const CLINIC_OPEN_MIN = 8 * 60;
const CLINIC_CLOSE_MIN = 17 * 60;

// appt_time is stored as a plain "HH:MM" string — converts it to minutes
// since midnight so busy/free ranges can be compared and merged as plain
// numbers instead of juggling string comparisons.
function parseTimeToMinutes(hhmm) {
  if (!hhmm || typeof hhmm !== 'string' || !hhmm.includes(':')) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

// durasi is a free-form label like "30 Min" (or "-" for the register-only
// fast-track in Registration.jsx, which never got a real appointment
// length). Pulls out the leading number, falling back to a conservative
// 30-minute default when there isn't one, so a missing/placeholder
// duration still blocks *some* time instead of collapsing to a zero-
// length (and therefore invisible) busy slot.
function parseDurationMinutes(durasi) {
  const match = typeof durasi === 'string' ? durasi.match(/\d+/) : null;
  return match ? Number(match[0]) : 30;
}

function formatMinutes(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, '0');
  const m = String(mins % 60).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Top-of-dashboard summary section: four stat cards (Sticky notes,
 * Waiting list, Status Patient, Doctor Available) plus a "Show/Hide Detail
 * Highlight" toggle that expands each card in place to reveal its
 * breakdown. The first three match Figma nodes 583:4311 (Show/collapsed)
 * and 583:4583 (Hide/expanded), redrawn with a flatter, more minimal
 * visual style; Doctor Available adds the same row's node 719:2071.
 *
 * Each card is a real accordion (height animates from its collapsed row
 * to its measured content height and back), so both expanding *and*
 * collapsing animate smoothly — no swapping between differently-shaped
 * DOM trees, which is what made the previous crossfade-based version
 * look abrupt on hide.
 *
 * Sticky notes is a free-text mini notes list (add/edit/delete, kept in
 * local state). Waiting list's per-doctor row opens a popup with the
 * actual patients (name + wait time) behind that doctor's count.
 *
 * `patients` is Today's Patient's real roster (Supabase-backed, not mock) —
 * for a Doctor it's already filtered to just their own patients, for
 * Receptionist/Admin it's everyone today. `doctorScoped` says which shape
 * it's in: `true` means "already one doctor, show a flat waiting list";
 * `false` means "spans every doctor, group the waiting list by `dokter`"
 * (see `waitingByDoctor` below). Either way, both the Waiting list and
 * Status Patient cards are always computed live from `patients` now — this
 * used to fall back to fixed mock numbers (WAITING_BY_DOCTOR, 7/3/3;
 * STATUS_BREAKDOWN, 19/1/2/2) for Receptionist/Admin, left over from before
 * the Supabase migration and never reconnected, which is why those two
 * cards used to show numbers with no relationship to the table underneath.
 */
export default function SummaryCards({ patients, doctorScoped = false }) {
  const [showDetail, setShowDetail] = useState(false);
  const [notes, setNotes] = useState(DEFAULT_STICKY_NOTES);
  const [newNote, setNewNote] = useState('');
  const [activeDoctor, setActiveDoctor] = useState(null);

  function addNote() {
    const trimmed = newNote.trim();
    if (!trimmed) return;
    setNotes((prev) => [...prev, trimmed]);
    setNewNote('');
  }

  function updateNote(index, value) {
    setNotes((prev) => prev.map((note, i) => (i === index ? value : note)));
  }

  function removeNote(index) {
    setNotes((prev) => prev.filter((_, i) => i !== index));
  }

  const roster = patients ?? [];

  // Doctor-scoped: a flat list of just this doctor's own waiting patients
  // (there's only one doctor to break down by, so grouping would be
  // pointless). Used directly by the "Waiting list" card when doctorScoped.
  const waitingList = useMemo(
    () =>
      roster
        .filter((p) => isWaitingStatus(p.status))
        // "Dalam Antrean" has no "Waiting " prefix to strip — replace() is a
        // no-op for it, so the pill just shows "Dalam Antrean" as-is,
        // matching the Status badge.
        .map((p) => ({ name: p.name, wait: p.status.replace('Waiting ', '') })),
    [roster]
  );

  // Receptionist/Admin: the same waiting patients, grouped by `dokter` so
  // the card can show one row per doctor (matching the old mock's shape)
  // with a click-through to that doctor's own list.
  const waitingByDoctor = useMemo(() => {
    const groups = new Map();
    for (const p of roster) {
      if (!isWaitingStatus(p.status)) continue;
      const doctor = p.dokter || 'Tidak diketahui';
      if (!groups.has(doctor)) groups.set(doctor, []);
      groups.get(doctor).push({ name: p.name, wait: p.status.replace('Waiting ', '') });
    }
    return Array.from(groups.entries()).map(([doctor, waiting]) => ({ doctor, patients: waiting }));
  }, [roster]);

  const totalWaiting = waitingList.length;

  const statusBreakdown = useMemo(
    () =>
      STATUS_BUCKETS.map((bucket) => ({
        label: bucket.label,
        dot: bucket.dot,
        value: roster.filter((p) => bucket.match(p.status)).length,
      })),
    [roster]
  );

  // One schedule per clinic doctor (not just the doctors who happen to
  // appear in `roster` today — a doctor with zero bookings still needs to
  // show up as fully available), built straight from `roster`'s own
  // `dokter`/`appt`/`durasi`/`status` fields. This is the live connection
  // to the Today's Patient table the card is meant to reflect: a new
  // booking, a cancellation, or a duration change on that table changes
  // what this card shows on the very next render, with no separate data
  // source of its own.
  const doctorSchedules = useMemo(() => {
    const nowMin = (() => {
      const now = new Date();
      return now.getHours() * 60 + now.getMinutes();
    })();

    return DOCTORS.map((doctor) => {
      // A cancelled slot never actually happens — same "what counts as a
      // real visit" rule lib/patients.js's summarizeVisits uses for a
      // patient's history — so it doesn't block the doctor's time here
      // either. Every other status (including a past "Complete" one)
      // still reflects a real slot on today's schedule.
      const rawBusy = roster
        .filter((p) => p.dokter === doctor && p.status !== 'Cancel')
        .map((p) => {
          const start = parseTimeToMinutes(p.appt);
          if (start == null) return null;
          const end = start + parseDurationMinutes(p.durasi);
          return { start, end };
        })
        .filter(Boolean)
        .sort((a, b) => a.start - b.start);

      // Merge overlapping/back-to-back bookings into one continuous block
      // — otherwise two appointments booked back-to-back would render as
      // separate chips with an artificial (and wrong) 0-minute "free" gap
      // between them.
      const busy = [];
      for (const slot of rawBusy) {
        const last = busy[busy.length - 1];
        if (last && slot.start <= last.end) {
          last.end = Math.max(last.end, slot.end);
        } else {
          busy.push({ ...slot });
        }
      }

      // Free = the complement of `busy` inside today's clinic hours.
      const free = [];
      let cursor = CLINIC_OPEN_MIN;
      for (const slot of busy) {
        const start = Math.max(slot.start, CLINIC_OPEN_MIN);
        if (start > cursor) free.push({ start: cursor, end: Math.min(start, CLINIC_CLOSE_MIN) });
        cursor = Math.max(cursor, Math.min(slot.end, CLINIC_CLOSE_MIN));
      }
      if (cursor < CLINIC_CLOSE_MIN) free.push({ start: cursor, end: CLINIC_CLOSE_MIN });

      const isAvailableNow = !busy.some((slot) => nowMin >= slot.start && nowMin < slot.end);

      return { doctor, busy, free, isAvailableNow };
    });
  }, [roster]);

  // Collapsed-state count: how many of the clinic's doctors are free at
  // this exact moment — the number a receptionist glancing at the row of
  // cards actually wants ("can I book someone in right now"), same idea
  // as "Waiting list"'s count being how many patients are waiting right
  // now rather than some other total.
  const doctorsAvailableNow = doctorSchedules.filter((d) => d.isAvailableNow).length;

  return (
    <div className="flex w-full flex-col gap-3">
      <DetailHighlightToggle expanded={showDetail} onToggle={() => setShowDetail((v) => !v)} />

      <div className="flex w-full flex-wrap items-start gap-4">
        {/* Sticky notes — free-text notes: type to add, click a note to
            edit in place, hover to reveal a delete button. */}
        <StatCard
          icon={<NotebookPen className="size-4" />}
          title="Sticky notes"
          count={notes.length}
          showDetail={showDetail}
        >
          <div className="flex flex-col gap-0.5 overflow-y-auto">
            {notes.map((note, index) => (
              <div
                key={index}
                className="group flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-slate-50"
              >
                <span className="size-1 shrink-0 rounded-full bg-slate-300" />
                <input
                  value={note}
                  onChange={(e) => updateNote(index, e.target.value)}
                  className="w-full min-w-0 rounded border border-transparent bg-transparent text-[13px] text-slate-700 outline-none focus:border-slate-200 focus:bg-white"
                />
                <button
                  type="button"
                  aria-label={`Hapus catatan ${note}`}
                  onClick={() => removeNote(index)}
                  className="shrink-0 text-slate-300 opacity-0 hover:text-slate-500 group-hover:opacity-100"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2 rounded-md px-1.5 py-1">
              <Plus className="size-3 shrink-0 text-slate-400" />
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addNote();
                  }
                }}
                onBlur={addNote}
                placeholder="Tambah catatan..."
                className="w-full min-w-0 rounded border border-transparent bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-200 focus:bg-white"
              />
            </div>
          </div>
        </StatCard>

        {/* Waiting list — for Receptionist/Admin, each row opens a popup
            listing the actual patients (name + wait time) behind that
            doctor's count. For a Doctor, the roster is already scoped to
            just them, so there's nothing to break down by doctor anymore —
            it's a flat list of their own waiting patients instead. */}
        <StatCard
          icon={<UsersRound className="size-4" />}
          title="Waiting list"
          count={totalWaiting}
          showDetail={showDetail}
        >
          <div className="flex flex-col gap-1.5 overflow-y-auto">
            {doctorScoped ? (
              waitingList.length === 0 ? (
                <p className="text-[13px] text-slate-400">Tidak ada pasien menunggu.</p>
              ) : (
                waitingList.map((p, i) => (
                  <div
                    key={`${p.name}-${i}`}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-1.5 text-xs"
                  >
                    <span className="font-medium text-slate-700">{p.name}</span>
                    <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-slate-600 ring-1 ring-slate-200">
                      {p.wait}
                    </span>
                  </div>
                ))
              )
            ) : waitingByDoctor.length === 0 ? (
              <p className="text-[13px] text-slate-400">Tidak ada pasien menunggu.</p>
            ) : (
              waitingByDoctor.map((item) => (
                <button
                  key={item.doctor}
                  type="button"
                  onClick={() => setActiveDoctor(item.doctor)}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-1.5 text-xs transition-colors hover:border-slate-200 hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-700">{item.doctor}</span>
                  <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-slate-600 ring-1 ring-slate-200">
                    {item.patients.length} waiting
                  </span>
                </button>
              ))
            )}
          </div>
        </StatCard>

        {/* Status patient breakdown — real counts from today's roster
            (this doctor's own patients when doctor-scoped, everyone
            today for Receptionist/Admin). */}
        <StatCard
          icon={<Users className="size-4" />}
          title="Status Patient"
          count={roster.length}
          showDetail={showDetail}
        >
          <div className="grid flex-1 grid-cols-4 gap-2">
            {statusBreakdown.map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center justify-center gap-1.5 rounded-lg bg-slate-50/60 py-2"
              >
                <p className="text-xl font-semibold text-slate-800">{item.value}</p>
                <div className="flex items-center gap-1">
                  <span className={cn('size-1.5 rounded-full', item.dot)} />
                  <span className="text-[11px] font-medium text-slate-500">{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </StatCard>

        {/* Doctor Available — per Figma node 719:2071. Count is how many
            of the clinic's doctors are free right now; expanding the row
            breaks that down per doctor into the actual hours they're
            already booked ("Appointment") vs. still open ("Available"),
            both derived live from `roster` (Today's Patient's real
            table), not a separate schedule of their own. */}
        <StatCard
          icon={<Stethoscope className="size-4" />}
          title="Doctor Available"
          count={doctorsAvailableNow}
          showDetail={showDetail}
        >
          <div className="flex flex-col gap-1.5 overflow-y-auto">
            {doctorSchedules.map((d) => (
              <div
                key={d.doctor}
                className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-700">{d.doctor}</span>
                  <span
                    className={cn(
                      'flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      d.isAvailableNow ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                    )}
                  >
                    <span className={cn('size-1.5 rounded-full', d.isAvailableNow ? 'bg-green-500' : 'bg-orange-500')} />
                    {d.isAvailableNow ? 'Available now' : 'In appointment'}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  <span className="text-[10px] font-semibold text-slate-400">Appt</span>
                  {d.busy.length === 0 ? (
                    <span className="text-[11px] text-slate-400">—</span>
                  ) : (
                    d.busy.map((slot, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200"
                      >
                        {formatMinutes(slot.start)}–{formatMinutes(slot.end)}
                      </span>
                    ))
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  <span className="text-[10px] font-semibold text-slate-400">Bebas</span>
                  {d.free.length === 0 ? (
                    <span className="text-[11px] text-slate-400">—</span>
                  ) : (
                    d.free.map((slot, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-green-50 px-1.5 py-0.5 text-[11px] font-medium text-green-700 ring-1 ring-green-100"
                      >
                        {formatMinutes(slot.start)}–{formatMinutes(slot.end)}
                      </span>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </StatCard>
      </div>

      {/* Waiting list detail popup */}
      <Dialog open={!!activeDoctor} onOpenChange={(open) => !open && setActiveDoctor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Waiting List — {activeDoctor}</DialogTitle>
            <DialogDescription>
              Daftar pasien yang sedang menunggu untuk dokter ini.
            </DialogDescription>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Pasien</TableHead>
                <TableHead className="text-right">Waktu Tunggu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(waitingByDoctor.find((d) => d.doctor === activeDoctor)?.patients ?? []).map(
                (p) => (
                  <TableRow key={p.name}>
                    <TableCell className="text-[#020617]">{p.name}</TableCell>
                    <TableCell className="text-right text-[#334155]">{p.wait}</TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
}
