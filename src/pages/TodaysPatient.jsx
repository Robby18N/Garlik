import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Moon,
  Bell,
  Search,
  Plus,
  Eye,
  Pencil,
  ArrowUpDown,
  X,
  MessageSquare,
  Send,
  Brush,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AccountMenu from '@/components/account-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import AppSidebar from '@/components/app-sidebar';
import SummaryCards from '@/components/summary-cards';
import PatientNameHoverCard from '@/components/patient-name-hover-card';
import PatientDetailSheet from '@/components/patient-detail-sheet';
import PatientNotFoundDialog from '@/components/patient-not-found-dialog';
import PatientFoundDialog from '@/components/patient-found-dialog';
import MakeAppointmentDialog from '@/components/make-appointment-dialog';
import EditAppointmentDialog from '@/components/edit-appointment-dialog';
import SettingRoomLabDialog from '@/components/setting-room-lab-dialog';
import MrCheckIcon, { medicalRiskDescription } from '@/components/mr-check-icon';
import TodaysPatientSkeleton from '@/components/todays-patient-skeleton';
import roomsLabsIcon from '@/assets/rooms-labs-icon.png';
import { useRole } from '@/context/role-context';
import { usePatientStatus } from '@/context/patient-status-context';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { escapeIlike } from '@/lib/patients';
import { computeWaitEstimates, isWaitingStatus } from '@/lib/wait-estimate';

const STATUS_STYLES = {
  Complete: 'border-transparent bg-[rgba(34,197,94,0.08)] text-[#16a34a]',
  'In Treatment': 'border-transparent bg-[rgba(59,130,246,0.08)] text-[#3b82f6]',
  Late: 'border-transparent bg-[rgba(168,85,247,0.08)] text-[#a855f7]',
  Cancel: 'border-transparent bg-[rgba(239,68,68,0.08)] text-[#ef4444]',
  // Neutral "just arrived, hasn't been timed yet" state — short for
  // "Waiting List", matching the "Waiting list" summary card above the
  // table — and deliberately a different (gray, not orange) color from the
  // two below so it reads as "not yet assessed" rather than "already
  // confirmed waiting X minutes". This is what a brand-new appointment
  // starts as (see loadAppointments' auto-promotion and the booking flows
  // in Registration.jsx / make-appointment-dialog.jsx) — NOT "Waiting 10
  // Min", which would falsely claim 10 minutes have already passed for
  // someone who, e.g., was only just booked, or whose doctor is still
  // mid-treatment with the patient before them. lib/wait-estimate.js's
  // isWaitingStatus() treats "Dalam Antrean" as part of the same "Waiting"
  // family as "Waiting 10/20 Min" for counts/estimates — keep them in sync
  // if this key ever changes again.
  'Dalam Antrean': 'border-transparent bg-[rgba(100,116,139,0.08)] text-[#64748b]',
  'Waiting 10 Min': 'border-transparent bg-[rgba(249,115,22,0.08)] text-[#f97316]',
  'Waiting 20 Min': 'border-transparent bg-[rgba(249,115,22,0.08)] text-[#f97316]',
};

// The day's rosters (today / tomorrow) now come from Supabase — see the
// fetch effect below — instead of the hardcoded MOCK_PATIENTS /
// MOCK_PATIENTS_TOMORROW arrays this page used before the pilot migration
// to real data (patients + appointments tables).

// Column widths as percentages of the table, proportional to Figma node
// 576:3192's `.Table Heading` frame widths (43/47/80/180/80/80/160/80/
// 138/50/300 out of 1325, Action taking the remainder). Using percentages
// instead of hard pixel widths means the table always scales to fit its
// container — no column (in particular Action, at the far right) ever
// gets cut off regardless of viewport width.
//
// A Room-narrower/Status-wider percentage rebalance was tried and
// reverted — it read as more lopsided, not tidier. Status is instead
// pinned to a fixed 140px (rather than a % share) — wide enough to fit
// its widest realistic content ("~135 menit lagi" plus the dropdown
// chevron) with room to spare, and unlike a percentage it won't shrink
// back down on a narrower viewport the way the other columns can. The
// per-cell padding on the Status/Lab TableCells further down is what
// governs the gap *after* the pill; this width is what stops the pill
// itself from crowding that padding out in the first place.
const COL_WIDTH = {
  no: 'w-[3.25%]',
  mr: 'w-[3.55%]',
  appt: 'w-[6.04%]',
  name: 'w-[13.58%]',
  dokter: 'w-[6.04%]',
  room: 'w-[6.04%]',
  keluhan: 'w-[12.08%]',
  durasi: 'w-[6.04%]',
  status: 'w-[140px]',
  lab: 'w-[3.77%]',
  remark: 'w-[22.64%]',
  action: 'w-[6.57%]',
};

const HEADER_CLASS =
  'h-auto whitespace-nowrap bg-[#f0fdf4] px-3 py-4 font-bold text-[#15803d]';

// Formatted by hand (rather than toLocaleDateString's default output) so the
// header always reads "Wed 12 Aug 2026" — short weekday, no leading zero on
// the day, short month, no commas — and stays live to whatever day it
// actually is instead of a date baked into the mock data.
function formatHeaderDate(date) {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  return `${weekday} ${date.getDate()} ${month} ${date.getFullYear()}`;
}

// Formatted by hand (rather than toLocaleTimeString) so new chat messages
// always read "HH:MM" — same reasoning as Activity.jsx's identical helper.
function nowTimeLabel() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const STATUS_OPTIONS = Object.keys(STATUS_STYLES);

/**
 * Remark column, reimagined as a two-way chat thread between Receptionist
 * and Doctor instead of a single free-text field — a doctor flagging
 * something on a patient (e.g. "sudah dipanggil ke R1") should reach the
 * receptionist and vice versa, not just overwrite one shared note. Clicking
 * the cell opens a small floating thread (Popover) with the message
 * history and a compose box; the cell itself shows a preview of the latest
 * message so the table stays scannable without opening anything.
 */
function RemarkChatCell({ patient, thread, senderLabel, onSend }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');

  function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSend(patient.id, trimmed);
    setDraft('');
  }

  const lastMessage = thread[thread.length - 1];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Remark conversation for ${patient.name}`}
          className="flex w-full items-center gap-1.5 rounded-md border border-transparent p-1 text-left text-sm text-[#334155] hover:border-slate-200 hover:bg-white"
        >
          <MessageSquare className="size-3.5 shrink-0 text-slate-400" />
          <span className="min-w-0 flex-1 truncate">
            {lastMessage ? lastMessage.text : (
              <span className="text-slate-400">Tulis remark...</span>
            )}
          </span>
          {thread.length > 0 && (
            <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
              {thread.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="w-[300px] p-0">
        <div className="flex flex-col gap-2 border-b border-[#e2e8f0] px-3 py-2.5">
          <p className="text-sm font-semibold text-slate-800">Percakapan &middot; {patient.name}</p>
          <p className="text-[11px] text-slate-400">Resepsionis &amp; Dokter</p>
        </div>
        <div className="flex max-h-52 flex-col gap-2 overflow-y-auto px-3 py-2.5">
          {thread.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">Belum ada pesan.</p>
          ) : (
            thread.map((msg) => {
              const isDoctorMsg = msg.sender !== 'Receptionist';
              return (
                <div
                  key={msg.id}
                  className={cn('flex max-w-[85%] flex-col gap-0.5', isDoctorMsg && 'ml-auto items-end')}
                >
                  <div
                    className={cn(
                      'rounded-lg px-2.5 py-1.5 text-[13px]',
                      isDoctorMsg ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-700'
                    )}
                  >
                    {msg.text}
                  </div>
                  <span className="px-0.5 text-[10px] text-slate-400">
                    {msg.sender} &middot; {msg.time}
                  </span>
                </div>
              );
            })
          )}
        </div>
        <div className="flex items-center gap-1.5 border-t border-[#e2e8f0] p-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Balas sebagai ${senderLabel}...`}
            aria-label={`Reply as ${senderLabel} for ${patient.name}`}
            className="h-8 w-full min-w-0 rounded-md border border-[#e2e8f0] bg-white px-2.5 text-[13px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-300"
          />
          <button
            type="button"
            aria-label="Send message"
            onClick={handleSend}
            className="flex size-8 shrink-0 items-center justify-center rounded-md bg-green-600 text-white hover:bg-green-700"
          >
            <Send className="size-3.5" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function TodaysPatient() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, doctorName } = useRole();
  const isReceptionist = role === 'Receptionist';
  // Doctor is scoped to their own clinical workflow: can't register a new
  // patient or book an appointment (that stays a front-desk job), and only
  // ever sees the roster of patients actually assigned to them.
  const isDoctor = role === 'Doctor';
  const chatSenderLabel = isDoctor ? doctorName : 'Receptionist';
  // Shimmer skeleton shown only for the specific Login → Today's Patient
  // handoff (flagged via router state from the login loading screen) — a
  // brief loading pass before the real header/summary cards/table crossfade
  // in. Arriving here any other way (e.g. Cancel from New Registration)
  // skips it entirely.
  const [showSkeleton, setShowSkeleton] = useState(() => Boolean(location.state?.fromLogin));

  useEffect(() => {
    if (!showSkeleton) return;
    const timer = setTimeout(() => setShowSkeleton(false), 900);
    return () => clearTimeout(timer);
  }, [showSkeleton]);

  const [dayFilter, setDayFilter] = useState('Today');
  // Today's/tomorrow's rosters — populated from Supabase (appointments
  // joined with patients) by loadAppointments below, not from a hardcoded
  // mock array anymore. Starts empty; `loadingPatients` distinguishes
  // "still loading" from "genuinely zero appointments" in the empty-state
  // row further down. New Registration (a full page nav to /registration,
  // which writes straight to Supabase and navigates back) and the
  // standalone "+ Appointment" dialog (which inserts into Supabase itself)
  // both rely on this page re-fetching afterwards rather than reconstructing
  // rows locally — see loadAppointments and its use as MakeAppointmentDialog's
  // onBooked callback below.
  const [todayPatients, setTodayPatients] = useState([]);
  const [tomorrowPatients, setTomorrowPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [nameSearchOpen, setNameSearchOpen] = useState(false);
  const [nameQuery, setNameQuery] = useState('');
  // Toolbar search — searches directly in the field as you type (no popup
  // step first), matching against patient name, patient ID, or phone number.
  const [toolbarQuery, setToolbarQuery] = useState('');
  // "No results" popup (Figma node 469:6139) — opens automatically a beat
  // after the toolbar search settles, so it doesn't flash open on every
  // single keystroke while the user is still typing. Its "found"
  // counterpart (same Figma node, opposite case) opens instead when the
  // query matches someone in the real `patients` table in Supabase — see
  // the search effect further down, which queries the database directly
  // and is intentionally independent of today's/tomorrow's table.
  const [notFoundOpen, setNotFoundOpen] = useState(false);
  const [foundOpen, setFoundOpen] = useState(false);
  const [foundPatient, setFoundPatient] = useState(null);
  // Autocomplete dropdown for the toolbar search — a lighter-weight, as-you-
  // type list of up to 6 matching patients (same name/mrn/phone match as the
  // found/not-found popups below, just not limited to a single row), so the
  // user can pick someone without waiting for the full debounce-triggered
  // modal or typing the whole name. `suggestionsOpen` is tracked separately
  // from "do we have suggestions" so a click/Escape/blur can hide the list
  // without throwing away the fetched data (e.g. re-focusing the field
  // re-opens it instantly using what's already there).
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [apptSortAsc, setApptSortAsc] = useState(true);
  // Remark is a two-way chat thread (Receptionist <-> Doctor) per patient
  // now, not a single free-text field — seeded from each appointment's
  // `remark` column (fetched from Supabase) as the opening message from
  // Receptionist, keyed by patient id so the thread survives
  // sorting/filtering/switching days. Starts empty and gets filled in by
  // the fetch effect below once the initial load lands.
  const [remarkThreads, setRemarkThreads] = useState({});

  function handleSendRemark(patientId, text) {
    setRemarkThreads((prev) => ({
      ...prev,
      [patientId]: [
        ...(prev[patientId] ?? []),
        { id: `${patientId}-${Date.now()}`, sender: chatSenderLabel, text, time: nowTimeLabel() },
      ],
    }));
  }

  // REQUIRES a one-time migration before this file is deployed — run once
  // in the Supabase SQL Editor:
  //   alter table appointments add column if not exists started_at timestamptz;
  // Without it, the `.select(...)` below (which now includes started_at)
  // fails outright and this whole page stops loading — see the live
  // wait-time estimate (lib/wait-estimate.js) that depends on this column.
  //
  // Loads today's/tomorrow's rosters from Supabase — appointments joined
  // with their patient — replacing the old MOCK_PATIENTS /
  // MOCK_PATIENTS_TOMORROW arrays. Pulled out as its own callback (not just
  // inline in a mount effect) because two write flows need to trigger a
  // fresh read afterwards: the standalone "+ Appointment" dialog calls this
  // directly once it finishes inserting into Supabase (see onBooked below),
  // and New Registration writes to Supabase then navigates back to this
  // page — which remounts it (each route is a distinct element under
  // AnimatePresence/Routes) and runs this same effect fresh on mount. So
  // neither write path needs to reconstruct a row locally anymore; both
  // just make sure the real data gets re-read.
  const loadAppointments = useCallback(async () => {
    setLoadingPatients(true);
    setLoadError(null);
    const { data, error } = await supabase
      .from('appointments')
      // started_at: stamped by persistStatus/EditAppointmentDialog the
      // moment a patient's status becomes "In Treatment" — feeds the live
      // wait-time estimate below (lib/wait-estimate.js). Requires the
      // `started_at timestamptz` column to already exist on `appointments`
      // in Supabase (see the migration note above loadAppointments' call
      // sites) — selecting a column that doesn't exist yet fails the whole
      // query, so that migration must run before this code is deployed.
      // patients(id, ...medical_risk_level): id is needed so the Edit
      // dialog can save a Doctor's risk assessment back to the right
      // patient row; medical_risk_level is that assessment itself (see
      // mr-check-icon.jsx's MEDICAL_RISK_LEVELS) — both require the
      // `alter table patients add column if not exists medical_risk_level
      // smallint;` migration to already be run in Supabase.
      .select(
        'id, appt_date, appt_time, dokter, room, keluhan, durasi, status, lab, remark, started_at, patients(id, mrn, name, category, phone, medical_risk_level)'
      )
      .order('appt_time', { ascending: true });

    if (error) {
      console.error('Failed to load appointments from Supabase', error);
      setLoadError(error.message);
      setLoadingPatients(false);
      toast.error('Gagal memuat data pasien dari database.');
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const nextToday = [];
    const nextTomorrow = [];
    const nextThreads = {};
    // Appointments booked while their date was still "tomorrow" start with
    // status=null, per the booking flows' own defaults (MakeAppointmentDialog
    // / Registration.jsx only auto-set a starting status for a same-day
    // booking). Nothing used to promote that null once the date actually
    // arrived, so it just sat blank in Today's Patient until a receptionist
    // or doctor happened to notice and fix it by hand. Collected here so it
    // can be corrected in the same load, same starting point a same-day
    // booking would've gotten — not a role decision, just catching the
    // record up to what it should already be.
    //
    // Promoted to the neutral "Dalam Antrean" status, NOT "Waiting 10 Min"
    // — this just means "hasn't been assessed yet", it doesn't claim any
    // specific amount of time has actually passed. Picking "Waiting 10 Min"
    // here would be an outright lie the moment it's wrong: e.g. patient B's
    // appointment lands right after patient A's, whose 60-minute treatment
    // with the same doctor only just started — B hasn't waited 10 minutes,
    // they've waited zero. "Waiting 10/20 Min" stay real observations for
    // staff to set by hand once they're actually true.
    const idsToPromote = [];

    for (const row of data ?? []) {
      const isToday = row.appt_date === todayStr;
      const resolvedStatus = isToday && !row.status ? 'Dalam Antrean' : row.status;
      if (isToday && !row.status) idsToPromote.push(row.id);

      const mapped = {
        id: row.id,
        patientId: row.patients?.id ?? null,
        // The MR column's icon reflects a Doctor's own clinical risk
        // assessment of this *patient* (not this appointment) — see
        // mr-check-icon.jsx's MEDICAL_RISK_LEVELS. null means no Doctor
        // has assessed them yet, which renders as a neutral "?" rather
        // than defaulting to any of the three real levels.
        medicalRiskLevel: row.patients?.medical_risk_level ?? null,
        appt: row.appt_time,
        name: row.patients?.name ?? '(Tidak diketahui)',
        category: row.patients?.category ?? 'Regular',
        dokter: row.dokter,
        room: row.room,
        keluhan: row.keluhan,
        durasi: row.durasi,
        status: resolvedStatus,
        lab: row.lab,
        remark: row.remark,
        phone: row.patients?.phone ?? '',
        mrn: row.patients?.mrn ?? null,
        startedAt: row.started_at,
      };
      nextThreads[row.id] =
        row.remark && row.remark !== '-'
          ? [{ id: `${row.id}-seed`, sender: 'Receptionist', text: row.remark, time: row.appt_time }]
          : [];

      if (isToday) nextToday.push(mapped);
      else if (row.appt_date === tomorrowStr) nextTomorrow.push(mapped);
    }

    if (idsToPromote.length > 0) {
      const { error: promoteError } = await supabase
        .from('appointments')
        .update({ status: 'Dalam Antrean' })
        .in('id', idsToPromote);
      if (promoteError) {
        // Non-fatal — the table still shows "Dalam Antrean" from
        // `resolvedStatus` above for this session; it just didn't persist,
        // so the next load would fall back to null again for these rows.
        console.error('Failed to auto-promote today\'s appointment status', promoteError);
      }
    }

    setTodayPatients(nextToday);
    setTomorrowPatients(nextTomorrow);
    setRemarkThreads((prev) => ({ ...nextThreads, ...prev }));
    setLoadingPatients(false);
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Status is editable by both Doctor and Receptionist now, but each only
  // owns half of it: Doctor moves the clinical side forward (In Treatment /
  // Complete / how long someone's been Waiting), Receptionist handles the
  // front-desk side (Late / Cancel). Admin keeps the full set. Options
  // outside a role's own set still render (so the pill always shows the
  // right label/color) but are disabled so they can't be picked.
  //
  // This lives in shared context (not local state) because Billing needs
  // to react to it too — a patient marked Complete here has to surface
  // their still-unpaid invoice at the top of Billing right away.
  const { statusOverrides, setStatus } = usePatientStatus();
  const allowedStatusOptions = isDoctor
    ? STATUS_OPTIONS.filter((option) => option !== 'Late' && option !== 'Cancel')
    : isReceptionist
      ? STATUS_OPTIONS.filter((option) => option === 'Late' || option === 'Cancel')
      : STATUS_OPTIONS;

  // Marking a patient Complete pauses on a "room's being cleaned" popup —
  // the same mark-ready step Activity uses — instead of applying the
  // status right away, so Complete always implies the room gets handed
  // back to Available deliberately rather than silently.
  const [cleaningDialog, setCleaningDialog] = useState(null);

  // Persists a status change to the appointment's row in Supabase — this
  // used to only update the ephemeral statusOverrides context (see
  // usePatientStatus), which meant every inline Status change here was
  // lost on reload and invisible to anyone else's session. Needed for real
  // now, not just as a nice-to-have: the live wait-time estimate (below)
  // depends on `started_at` actually being recorded in the database the
  // moment a doctor starts a treatment — an in-memory-only timestamp would
  // vanish the instant the page refreshed, breaking the estimate for
  // everyone else looking at the same roster.
  //
  // `setStatus` (the ephemeral override) still runs first for instant
  // visual feedback while the network request is in flight; loadAppointments
  // afterwards reconciles everything (this patient's real status/started_at,
  // and any other patient's, e.g. if two people are editing at once) from
  // the database, which is what the wait-time estimate actually reads.
  async function persistStatus(patient, nextStatus) {
    const prevStatus = statusOverrides[patient.id] ?? patient.status;
    setStatus(patient.id, nextStatus);
    const patch = { status: nextStatus };
    if (nextStatus === 'In Treatment' && prevStatus !== 'In Treatment') {
      patch.started_at = new Date().toISOString();
    }
    const { error } = await supabase.from('appointments').update(patch).eq('id', patient.id);
    if (error) {
      console.error('Failed to save status change', error);
      toast.error('Status tersimpan sementara di layar ini, tapi gagal disimpan ke database.');
      return;
    }
    loadAppointments();
  }

  function applyStatusChange(patient, nextStatus) {
    persistStatus(patient, nextStatus);
    toast.success(`Status ${patient.name} diperbarui ke "${nextStatus}"`);
  }

  function handleChangeStatus(patient, nextStatus) {
    if (nextStatus === 'Complete') {
      setCleaningDialog({ patient });
      return;
    }
    applyStatusChange(patient, nextStatus);
  }

  function handleConfirmRoomReady() {
    if (!cleaningDialog) return;
    const { patient } = cleaningDialog;
    persistStatus(patient, 'Complete');
    toast.success(`${patient.name} selesai ditangani — Ruangan ${patient.room} siap digunakan`);
    setCleaningDialog(null);
  }

  // "Setting Room & Lab" popup (Figma node 556:859), opened from the
  // toolbar's "Rooms & Labs" button. `roomLabSettings` only remembers the
  // last thing saved *this session*, purely to pre-fill the dialog if it's
  // reopened without a reload — it's no longer where the actual Room/Lab
  // values come from (see handleSaveRoomLabSettings below).
  const [roomLabSettingOpen, setRoomLabSettingOpen] = useState(false);
  const [roomLabSettings, setRoomLabSettings] = useState(null);

  // "Buat Appointment" popup opened from the toolbar's "Appointment" button —
  // finds an already-registered patient, then books their appointment
  // (doctor/room/keluhan/duration/date/time). It also opens (pre-filled,
  // skipping the search step) from PatientFoundDialog's "Appointment" CTA —
  // `appointmentPreselect` carries that patient across in that case.
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [appointmentPreselect, setAppointmentPreselect] = useState(null);

  function handleBookFoundAppointment(patient) {
    setAppointmentPreselect(patient);
    setAppointmentDialogOpen(true);
  }

  // "Edit Appointment" popup opened from each row's pencil icon — lets
  // Doctor/Room/Keluhan/Est. Duration/Status/Lab be corrected and saved
  // straight to the appointment's row in Supabase. Most needed for
  // appointments booked while their date was still "tomorrow" (so
  // Status/Lab start out null/"-" per the booking flows' own defaults, see
  // loadAppointments above) that have since become "today" with no one
  // having assigned them real values yet.
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);

  function handleEditPatient(patient) {
    setEditingAppointment(patient);
    setEditDialogOpen(true);
  }

  // Applies each doctor's Room + Lab assignment straight to the real
  // appointment rows in Supabase — every one of that doctor's appointments
  // for TODAY and TOMORROW both get the same Room and Lab value, the same
  // way a front-desk "who's in which room today" assignment would actually
  // work. This used to only touch an in-memory override that (a) only ever
  // affected the Tomorrow view's display and (b) never survived a reload —
  // Today's table was completely unaffected no matter what was Saved here.
  // Per-patient Room/Lab can still be corrected individually afterwards via
  // each row's pencil (Edit) button; this dialog is for the common case of
  // setting a doctor's room for the whole day in one go.
  async function handleSaveRoomLabSettings(nextSettings) {
    setRoomLabSettings(nextSettings);

    const todayStr = new Date().toISOString().slice(0, 10);
    const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const results = await Promise.all(
      Object.entries(nextSettings).map(([doctor, { room, lab }]) =>
        supabase
          .from('appointments')
          .update({ room, lab: lab ? 'OK' : 'NOK' })
          .eq('dokter', doctor)
          .in('appt_date', [todayStr, tomorrowStr])
      )
    );

    const failed = results.filter((r) => r.error);
    if (failed.length > 0) {
      failed.forEach((r) => console.error('Failed to apply Room & Lab setting', r.error));
      toast.error('Sebagian setting Room & Lab gagal disimpan ke database — coba lagi.');
    } else {
      toast.success('Room & Lab settings saved — Today & Tomorrow diperbarui');
    }
    loadAppointments();
  }

  // Room/Lab now always come straight from the appointment's own row
  // (kept persisted by handleSaveRoomLabSettings and by the per-patient
  // Edit dialog) — no more ephemeral Tomorrow-only override.
  function getRoomLabDisplay(patient) {
    return { room: patient.room, lab: patient.lab };
  }

  function handleViewPatient(patient) {
    setSelectedPatient(patient);
    setDetailOpen(true);
  }

  // The day's full roster before any search/name filtering — scoped down to
  // just this doctor's own patients when acting as Doctor, so the table and
  // the "Showing X of Y" count agree on what "the list" means for this
  // login.
  const daySource = useMemo(() => {
    const base = dayFilter === 'Tomorrow' ? tomorrowPatients : todayPatients;
    return isDoctor ? base.filter((p) => p.dokter === doctorName) : base;
  }, [dayFilter, isDoctor, doctorName, todayPatients, tomorrowPatients]);

  // Live wait-time estimate (see lib/wait-estimate.js) for every waiting
  // patient, keyed by their appointment id. Only meaningful for "Today" —
  // "Tomorrow" hasn't started yet, so there's no doctor currently "In
  // Treatment" to estimate around, and showing a number there would read
  // as a real-time queue position that doesn't exist yet.
  //
  // `nowTick` exists purely to force this to recompute periodically — the
  // underlying data (daySource, statusOverrides) doesn't need to change
  // for the *displayed* minutes to drift, since they're derived from
  // elapsed wall-clock time.
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const estimateRoster = useMemo(
    () => daySource.map((p) => ({ ...p, status: statusOverrides[p.id] ?? p.status })),
    [daySource, statusOverrides]
  );
  const waitEstimates = useMemo(
    () => (dayFilter === 'Today' ? computeWaitEstimates(estimateRoster, nowTick) : new Map()),
    [estimateRoster, nowTick, dayFilter]
  );

  // Only the Patient Name column's own search (the magnifying-glass popover
  // in the table header) filters this table — it's the tool for finding
  // someone who already has an appointment today/tomorrow. The toolbar
  // search above the table is a separate, deliberately disconnected tool:
  // it doesn't touch this list at all, see the effect below.
  const visiblePatients = useMemo(() => {
    const byName = nameQuery.trim()
      ? daySource.filter((p) => p.name.toLowerCase().includes(nameQuery.trim().toLowerCase()))
      : daySource;

    return [...byName].sort((a, b) =>
      apptSortAsc ? a.appt.localeCompare(b.appt) : b.appt.localeCompare(a.appt)
    );
  }, [daySource, nameQuery, apptSortAsc]);

  // The toolbar search (Cari Pasien / ID Patient / Nomor Telp) looks
  // patients up directly in the real `patients` table in Supabase — it's
  // intentionally independent of daySource/visiblePatients: the table
  // already has its own search (Patient Name column) for "who's on
  // today's/tomorrow's schedule". The toolbar's only job is "is this person
  // in our patient database at all" — answered with one of the two popups
  // below, regardless of whether they also happen to be on today's or
  // tomorrow's list already.
  //
  // This effect ONLY fetches the autocomplete suggestions as the user types
  // (debounced so it doesn't fire a request on every keystroke) — it does
  // NOT open the found/not-found popup by itself anymore. Popping a modal
  // open the instant typing pauses felt intrusive while the user was still
  // mid-search or browsing the dropdown. Instead the popup only opens from
  // an explicit action: pressing Enter (runToolbarSearch, below) or clicking
  // one of the suggestions (handleSelectSuggestion, below).
  useEffect(() => {
    const trimmed = toolbarQuery.trim();
    if (!trimmed) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      setHighlightedIndex(-1);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const esc = escapeIlike(trimmed);
      const { data, error } = await supabase
        .from('patients')
        .select('id, mrn, name, phone, category')
        .or(`name.ilike.%${esc}%,mrn.ilike.%${esc}%,phone.ilike.%${esc}%`)
        .limit(6);

      if (cancelled) return;

      if (error) {
        console.error('Failed to search patient database', error);
        return;
      }

      setSuggestions(data ?? []);
      setHighlightedIndex(-1);
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [toolbarQuery]);

  // Explicit search, run only when the user presses Enter (not on every
  // keystroke) — queries Supabase directly rather than trusting whatever the
  // debounced `suggestions` list currently holds, so a fast typist who hits
  // Enter before the 500ms debounce settles still gets an accurate result
  // instead of a stale/empty one.
  async function runToolbarSearch(query) {
    const trimmed = query.trim();
    if (!trimmed) return;
    const esc = escapeIlike(trimmed);
    const { data, error } = await supabase
      .from('patients')
      .select('id, mrn, name, phone, category')
      .or(`name.ilike.%${esc}%,mrn.ilike.%${esc}%,phone.ilike.%${esc}%`)
      .limit(1);

    if (error) {
      console.error('Failed to search patient database', error);
      return;
    }

    setSuggestionsOpen(false);
    const match = data?.[0] ?? null;
    if (match) {
      setFoundPatient(match);
      setFoundOpen(true);
      setNotFoundOpen(false);
    } else {
      setNotFoundOpen(true);
      setFoundOpen(false);
    }
  }

  // Picking a suggestion from the autocomplete dropdown jumps straight to
  // the "found" popup for that exact patient (no extra query needed — we
  // already have the row from the suggestions fetch), fills the field with
  // their full name so it stays a sensible value if the user keeps editing,
  // and closes the list.
  function handleSelectSuggestion(patient) {
    setToolbarQuery(patient.name);
    setFoundPatient(patient);
    setFoundOpen(true);
    setNotFoundOpen(false);
    setSuggestionsOpen(false);
    setHighlightedIndex(-1);
  }

  function handleToolbarKeyDown(e) {
    const dropdownActive = suggestionsOpen && suggestions.length > 0;
    if (e.key === 'ArrowDown') {
      if (!dropdownActive) return;
      e.preventDefault();
      setHighlightedIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      if (!dropdownActive) return;
      e.preventDefault();
      setHighlightedIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // If a suggestion is highlighted (arrowed to, or hovered), Enter picks
      // it — same as clicking it. Otherwise Enter runs a fresh search for
      // whatever's typed, matching the "type a name then Enter" flow.
      if (dropdownActive && highlightedIndex >= 0) {
        handleSelectSuggestion(suggestions[highlightedIndex]);
      } else {
        runToolbarSearch(toolbarQuery);
      }
    } else if (e.key === 'Escape') {
      setSuggestionsOpen(false);
    }
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {showSkeleton ? (
        <motion.div
          key="skeleton"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          <TodaysPatientSkeleton />
        </motion.div>
      ) : (
    <motion.div
      key="content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="flex min-h-screen w-full flex-col bg-[#f5f6f8] lg:flex-row"
    >
      <AppSidebar activeKey="patients" width={60} />

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top header */}
        <header className="flex h-[50px] w-full items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex min-w-0 items-baseline gap-3">
            <h1 className="text-lg font-bold text-slate-900">Today’s Patient</h1>
            <span className="truncate text-sm text-slate-500">{formatHeaderDate(new Date())}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex size-[30px] items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              aria-label="Toggle theme"
            >
              <Moon className="size-4" />
            </button>
            <button
              type="button"
              className="flex size-[30px] items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
            </button>
            <AccountMenu />
          </div>
        </header>

        {/* Page body */}
        <main className="flex min-w-0 flex-1 flex-col gap-4 p-6">
          <SummaryCards
            // Always today's real roster (Supabase-backed), not the fixed
            // mock this used to fall back to for Receptionist/Admin — that
            // mock was a leftover from before the Supabase migration and
            // never got reconnected, which is why the "Waiting list"/
            // "Status Patient" cards used to show numbers unrelated to the
            // table underneath them. Doctor still only sees their own
            // patients; Receptionist/Admin see everyone today.
            patients={(isDoctor
              ? todayPatients.filter((p) => p.dokter === doctorName)
              : todayPatients
            ).map((p) => ({
              ...p,
              status: statusOverrides[p.id] ?? p.status,
            }))}
            doctorScoped={isDoctor}
          />

          <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            {/* Toolbar row — rebuilt per Figma node 600:6237 ("2nd Level"):
                the Today/Tomorrow toggle now sits with the entries count on
                the left, a new "Appointment" button joins the right-side
                cluster, and every button/field here uses the "small" size
                (36px height, tighter 12px/6px padding) instead of the
                larger default padding used elsewhere in the app. */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-base font-semibold text-slate-950">
                  Showing {visiblePatients.length} of {daySource.length} entries
                </p>

                {/* Today / Tomorrow toggle, matching Figma node 576:3118 — the switch
                    track is always blue (#3b82f6) regardless of on/off state. */}
                <div className="flex h-9 items-center gap-2.5 rounded-full border border-slate-200 bg-white px-4">
                  <span className="text-sm font-medium text-slate-950">Today</span>
                  <Switch
                    checked={dayFilter === 'Tomorrow'}
                    onCheckedChange={(checked) => setDayFilter(checked ? 'Tomorrow' : 'Today')}
                    className="data-[state=checked]:bg-[#3b82f6] data-[state=unchecked]:bg-[#3b82f6]"
                  />
                  <span className="text-sm font-medium text-slate-950">Tomorrow</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div id="search-patient-trigger" className="relative w-[360px] max-w-full">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={toolbarQuery}
                    onChange={(e) => {
                      setToolbarQuery(e.target.value);
                      setSuggestionsOpen(true);
                      setHighlightedIndex(-1);
                    }}
                    onFocus={() => {
                      if (suggestions.length > 0) setSuggestionsOpen(true);
                    }}
                    onBlur={() => {
                      // Delayed so a click on a suggestion (which blurs the
                      // input first) still registers before the list unmounts.
                      window.setTimeout(() => setSuggestionsOpen(false), 120);
                    }}
                    onKeyDown={handleToolbarKeyDown}
                    placeholder="Cari Pasien / ID Patient / Nomor Telp"
                    aria-label="Cari pasien berdasarkan nama, ID pasien, atau nomor telepon"
                    role="combobox"
                    aria-expanded={suggestionsOpen && suggestions.length > 0}
                    aria-autocomplete="list"
                    autoComplete="off"
                    className="h-9 rounded-3xl border border-solid border-[#e2e8f0] bg-white pl-9 pr-8 text-sm shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                  />
                  {toolbarQuery && (
                    <button
                      type="button"
                      aria-label="Clear search"
                      onClick={() => {
                        setToolbarQuery('');
                        setSuggestions([]);
                        setSuggestionsOpen(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="size-4" />
                    </button>
                  )}

                  {/* Autocomplete dropdown — up to 6 patients matching the
                      same name/mrn/phone search as the found/not-found
                      popups, so the user can jump straight to one instead of
                      typing the full name and waiting for the debounce. */}
                  {suggestionsOpen && suggestions.length > 0 && (
                    <div
                      role="listbox"
                      aria-label="Patient suggestions"
                      className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white py-1 shadow-[0px_8px_24px_0px_rgba(0,0,0,0.12)]"
                    >
                      {suggestions.map((patient, index) => (
                        <button
                          key={patient.id}
                          type="button"
                          role="option"
                          aria-selected={highlightedIndex === index}
                          onMouseDown={(e) => e.preventDefault()}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          onClick={() => handleSelectSuggestion(patient)}
                          className={cn(
                            'flex w-full flex-col items-start gap-0.5 px-3.5 py-2 text-left',
                            highlightedIndex === index ? 'bg-[#f0fdf4] text-[#15803d]' : 'hover:bg-slate-50'
                          )}
                        >
                          <span className="truncate text-sm font-medium text-[#020617]">
                            {patient.name}
                          </span>
                          <span className="truncate text-xs text-slate-400">
                            {patient.mrn}
                            {patient.phone ? ` · ${patient.phone}` : ''}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Doctor can't register a new patient or book an appointment —
                    that stays a front-desk task, so both buttons are simply
                    left out of their toolbar entirely. */}
                {!isDoctor && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => navigate('/registration', { state: { flow: 'new-registration' } })}
                      className="h-9 rounded-3xl bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                    >
                      <Plus className="size-4" />
                      New Registration
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => setAppointmentDialogOpen(true)}
                      className="h-9 rounded-3xl bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                    >
                      <Plus className="size-4" />
                      Appointment
                    </Button>
                  </>
                )}

                {/* Rooms & Labs is a front-desk setup task too — Doctor
                    doesn't manage room/lab assignments, so it's left out of
                    their toolbar along with New Registration/Appointment. */}
                {!isDoctor && (
                  <Button
                    size="sm"
                    onClick={() => setRoomLabSettingOpen(true)}
                    className="h-9 rounded-3xl bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                  >
                    <img src={roomsLabsIcon} alt="" className="size-4" />
                    Rooms &amp; Labs
                  </Button>
                )}
              </div>
            </div>

            {/* Patients table — fixed column widths matching Figma node 576:3192 */}
            <div className="w-full min-w-0 overflow-x-auto">
              <Table className="table-fixed min-w-[1180px]">
                <TableHeader>
                  <TableRow className="border-transparent hover:bg-transparent">
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.no, 'text-left')}>No</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.mr, 'text-left')}>MR</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.appt)}>
                      <button
                        type="button"
                        onClick={() => setApptSortAsc((v) => !v)}
                        className="inline-flex items-center gap-1.5 text-inherit"
                        aria-label="Sort by appointment time"
                      >
                        Appt
                        <ArrowUpDown className={cn('size-3.5', apptSortAsc ? 'text-[#15803d]' : 'text-[#86efac]')} />
                      </button>
                    </TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.name)}>
                      {/* Caption always stays "Patient Name" — clicking the icon opens
                          a real (Radix) popover with the search function, so the
                          column label never disappears and clicking elsewhere in the
                          table (e.g. a row below) correctly dismisses it. */}
                      <Popover open={nameSearchOpen} onOpenChange={setNameSearchOpen}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 text-inherit"
                            aria-label="Search patient name"
                          >
                            <Search className="size-3.5 shrink-0" />
                            Patient Name
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="start"
                          sideOffset={8}
                          className="w-[220px] border-none bg-transparent p-0 shadow-none"
                        >
                          {/* Pill search input matching Figma's Input component
                              (node 576:3122): white rounded-full, border #e2e8f0,
                              shadow-xs. */}
                          <div className="flex h-9 items-center gap-2 rounded-3xl border border-[#e2e8f0] bg-white px-3 shadow-[0px_2px_8px_0px_rgba(0,0,0,0.08)]">
                            <Search className="size-3.5 shrink-0 text-[#64748b]" />
                            <input
                              autoFocus
                              value={nameQuery}
                              onChange={(e) => setNameQuery(e.target.value)}
                              placeholder="Cari nama pasien"
                              className="w-full min-w-0 bg-transparent text-xs font-normal text-[#020617] placeholder:text-[#64748b] focus:outline-none"
                            />
                            {nameQuery && (
                              <button
                                type="button"
                                aria-label="Clear name search"
                                onClick={() => setNameQuery('')}
                              >
                                <X className="size-3.5 shrink-0 text-[#64748b]" />
                              </button>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.dokter)}>Dokter</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.room)}>Room</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.keluhan)}>Keluhan</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.durasi)}>Est. Dur</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.status)}>Status</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.lab)}>Lab</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.remark)}>Remark</TableHead>
                    <TableHead className={cn(HEADER_CLASS, COL_WIDTH.action, 'text-left')}>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiblePatients.map((patient, index) => {
                    const { room: roomDisplay, lab: labDisplay } = getRoomLabDisplay(patient);
                    return (
                    <TableRow
                      key={patient.id}
                      className={cn('border-b border-[#e2e8f0]', index % 2 === 1 && 'bg-[#f8fafc]')}
                    >
                      <TableCell className="!align-middle px-3 py-3 text-left text-[#334155]">{index + 1}</TableCell>
                      <TableCell className="!align-middle px-3 py-3 text-left">
                        <div
                          className="flex items-center justify-start"
                          title={medicalRiskDescription(patient.medicalRiskLevel)}
                        >
                          <MrCheckIcon variant={patient.medicalRiskLevel} />
                        </div>
                      </TableCell>
                      <TableCell className="!align-middle px-3 py-3 text-left text-[#334155]">{patient.appt}</TableCell>
                      <TableCell className="!align-middle px-3 py-3 text-left">
                        <PatientNameHoverCard name={patient.name} category={patient.category} />
                      </TableCell>
                      <TableCell className="!align-middle px-3 py-3 text-left text-[#334155]">{patient.dokter}</TableCell>
                      <TableCell className="!align-middle px-3 py-3 text-left text-[#334155]">{roomDisplay}</TableCell>
                      <TableCell className="!align-middle px-3 py-3 whitespace-normal text-left text-[#334155]">
                        {patient.keluhan}
                      </TableCell>
                      <TableCell className="!align-middle px-3 py-3 text-left text-[#334155]">{patient.durasi}</TableCell>
                      <TableCell className="!align-middle pl-3 pr-9 py-3 text-left">
                        {(() => {
                          const currentStatus = statusOverrides[patient.id] ?? patient.status;
                          // Tomorrow's not-yet-happened rows have no status
                          // at all yet — nothing to show or edit.
                          if (!currentStatus) return <span className="text-[#94a3b8]">-</span>;
                          // Once a doctor marks a patient Complete, the
                          // front desk can't reopen it — a finished
                          // clinical outcome shouldn't be walked back from
                          // Receptionist, so their cell locks to a
                          // read-only pill from this point on.
                          if (isReceptionist && currentStatus === 'Complete') {
                            return (
                              <Badge className={cn('rounded-full px-2.5 py-1', STATUS_STYLES[currentStatus])}>
                                {currentStatus}
                              </Badge>
                            );
                          }
                          // While a patient is still waiting to be seen, the
                          // pill shows the live estimated wait (see
                          // lib/wait-estimate.js) instead of the raw status
                          // label — the underlying `value`/options are
                          // untouched, this only overrides what the trigger
                          // displays. `title` keeps the real status name
                          // available on hover so it's never actually
                          // hidden, just not the headline text.
                          const estimate = isWaitingStatus(currentStatus)
                            ? waitEstimates.get(patient.id)
                            : null;
                          return (
                            <Select
                              value={currentStatus}
                              onValueChange={(value) => handleChangeStatus(patient, value)}
                            >
                              <SelectTrigger
                                size="sm"
                                aria-label={`Change status for ${patient.name}`}
                                title={estimate ? currentStatus : undefined}
                                className={cn(
                                  'w-fit gap-1 rounded-full border-none px-2.5 py-1 text-xs font-semibold shadow-none',
                                  STATUS_STYLES[currentStatus]
                                )}
                              >
                                <SelectValue>{estimate?.label ?? currentStatus}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map((option) => (
                                  <SelectItem
                                    key={option}
                                    value={option}
                                    disabled={!allowedStatusOptions.includes(option)}
                                  >
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="!align-middle pl-4 pr-3 py-3 text-left text-[#334155]">{labDisplay}</TableCell>
                      <TableCell className="!align-middle px-3 py-3 text-left">
                        <RemarkChatCell
                          patient={patient}
                          thread={remarkThreads[patient.id] ?? []}
                          senderLabel={chatSenderLabel}
                          onSend={handleSendRemark}
                        />
                      </TableCell>
                      <TableCell className="!align-middle px-3 py-3 text-left">
                        <div className="flex items-center justify-start gap-2">
                          <button
                            type="button"
                            data-testid={`view-patient-${index}`}
                            aria-label={`View ${patient.name}`}
                            onClick={() => handleViewPatient(patient)}
                            className="flex size-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Eye className="size-4" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Edit ${patient.name}`}
                            onClick={() => handleEditPatient(patient)}
                            className="flex size-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Pencil className="size-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                  {visiblePatients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={12} className="h-16 text-left text-[#64748b]">
                        {loadingPatients
                          ? 'Memuat data pasien...'
                          : loadError
                            ? `Gagal memuat data pasien: ${loadError}`
                            : 'Tidak ada pasien dengan nama tersebut.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <PatientDetailSheet
            patient={selectedPatient}
            open={detailOpen}
            onOpenChange={setDetailOpen}
          />
          <PatientNotFoundDialog open={notFoundOpen} onOpenChange={setNotFoundOpen} />
          <PatientFoundDialog
            open={foundOpen}
            onOpenChange={setFoundOpen}
            patient={foundPatient}
            onBookAppointment={handleBookFoundAppointment}
          />
          <MakeAppointmentDialog
            open={appointmentDialogOpen}
            onOpenChange={(next) => {
              setAppointmentDialogOpen(next);
              if (!next) setAppointmentPreselect(null);
            }}
            onBooked={loadAppointments}
            preselectedPatient={appointmentPreselect}
          />
          <EditAppointmentDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            appointment={editingAppointment}
            statusOptions={STATUS_OPTIONS}
            allowedStatusOptions={allowedStatusOptions}
            canEditMedicalRisk={isDoctor}
            onSaved={loadAppointments}
            onStatusSaved={setStatus}
          />
          <SettingRoomLabDialog
            open={roomLabSettingOpen}
            onOpenChange={setRoomLabSettingOpen}
            settings={roomLabSettings}
            onSave={handleSaveRoomLabSettings}
          />

          {/* Mirrors Activity's "room's being cleaned" step — marking a
              patient Complete here means their room needs a mark-ready
              confirmation too, not just a status label flip. */}
          <Dialog
            open={!!cleaningDialog}
            onOpenChange={(open) => !open && setCleaningDialog(null)}
          >
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Selesai Melayani {cleaningDialog?.patient.name}</DialogTitle>
                <DialogDescription>
                  Ruangan {cleaningDialog?.patient.room} sedang dibersihkan sebelum siap digunakan
                  kembali.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 py-2">
                <div className="flex size-14 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                  <Brush className="size-6" />
                </div>
                <p className="text-center text-sm text-slate-500">
                  Tandai ruangan siap setelah proses pembersihan selesai.
                </p>
                <Button
                  onClick={handleConfirmRoomReady}
                  className="h-10 w-full rounded-xl bg-green-600 text-sm font-medium text-white hover:bg-green-700"
                >
                  <Sparkles className="size-4" />
                  Tandai Ruangan Siap
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </motion.div>
      )}
    </AnimatePresence>
  );
}
