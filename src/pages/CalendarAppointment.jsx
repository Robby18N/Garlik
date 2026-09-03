import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Moon,
  Bell,
  Search,
  Clock,
  PlusCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

import AccountMenu from '@/components/account-menu';
import MakeAppointmentDialog from '@/components/make-appointment-dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { DOCTORS } from '@/context/role-context';
import { formatRupiah, getTreatmentPrice, searchTreatmentPrices } from '@/lib/treatment-prices';

// Full-page "Calendar Appointment" view — ported from the Figma design
// (node 821:649) to replace the old "Buat Appointment" modal's cramped
// 2-step dialog with a per-time-slot schedule: every slot shows which
// doctors are already booked, which are still free, and a "+" to book a
// new appointment right there. Real data throughout (Supabase
// `appointments`/`patients`), not the design's static mockup content —
// only the decorative sidebar widgets (Promo & Discount, the treatment
// price search) stay as reference/placeholder features since there's no
// promo or pricing table backing them yet.

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const CLINIC_START = '08:00';
const CLINIC_END = '17:00';
const ISOMA = '__isoma__';

const PROMO_ITEMS = [
  { title: 'Discount Scaling up to 15%', date: '10 September 2026' },
  { title: 'Discount Scaling up to 15%', date: '15 September 2026' },
  { title: 'Discount Scaling up to 15%', date: '17 September 2026' },
];

function pad2(n) {
  return String(n).padStart(2, '0');
}

// Local-calendar date -> "YYYY-MM-DD", built from getFullYear/Month/Date
// (never toISOString/UTC) so a plain day like "3 Sept 2026" can't shift to
// the 2nd or 4th depending on the server's timezone.
function toDateStr(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function addDays(d, n) {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

// Half-hour slots across clinic hours — merged below with any real
// appointment times that don't land on the half hour (e.g. "10:15"), so an
// irregular booking still gets its own row instead of being hidden.
function buildHalfHourGrid(startHHMM, endHHMM) {
  const [sh, sm] = startHHMM.split(':').map(Number);
  const [eh, em] = endHHMM.split(':').map(Number);
  const out = [];
  let h = sh;
  let m = sm;
  while (h < eh || (h === eh && m <= em)) {
    out.push(`${pad2(h)}:${pad2(m)}`);
    m += 30;
    if (m >= 60) {
      m -= 60;
      h += 1;
    }
  }
  return out;
}

// Sunday-first month grid, padded with the trailing days of the previous
// month and leading days of the next so every week row has exactly 7 cells
// — matches the Figma mini-calendar (muted "30 31 … 1 2 3" style padding).
function buildMonthGrid(cursor) {
  const first = startOfMonth(cursor);
  const gridStart = addDays(first, -first.getDay());
  const weeks = [];
  let day = gridStart;
  for (let w = 0; w < 6; w += 1) {
    const week = [];
    for (let i = 0; i < 7; i += 1) {
      week.push({ date: day, inMonth: day.getMonth() === cursor.getMonth() });
      day = addDays(day, 1);
    }
    weeks.push(week);
    // Stop once we've covered the whole month and filled its last week —
    // avoids a trailing all-next-month 6th row for short months.
    if (week[6].date.getMonth() !== cursor.getMonth() && day.getMonth() !== cursor.getMonth()) break;
  }
  return weeks;
}

function DoctorPill({ children, muted }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium',
        muted ? 'border-transparent bg-black/[0.04] text-slate-400' : 'border-slate-200 bg-white text-slate-600'
      )}
    >
      {children}
    </span>
  );
}

function AppointmentCard({ appt }) {
  const harga = getTreatmentPrice(appt.keluhan);
  const rows = [
    ['Pasien', appt.patientName],
    ['Keluhan', appt.keluhan || '-'],
    ['Harga', formatRupiah(harga)],
    ['Dokter', appt.dokter],
  ];
  return (
    <div className="relative min-w-[220px] flex-1 basis-[220px] rounded-lg bg-black/[0.04] py-2.5 pl-4 pr-3">
      <div className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-green-600" />
      <div className="flex flex-col gap-1 text-sm text-slate-900">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start gap-3">
            <span className="w-14 shrink-0 text-slate-500">{label}</span>
            <span className="min-w-0 truncate font-medium" title={value}>
              : {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CalendarAppointment() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calendarCursor, setCalendarCursor] = useState(() => startOfMonth(new Date()));
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthDots, setMonthDots] = useState(() => new Set());
  const [promoOpen, setPromoOpen] = useState(true);
  const [treatmentQuery, setTreatmentQuery] = useState('');
  const [treatmentFocused, setTreatmentFocused] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingPrefill, setBookingPrefill] = useState(null);
  const blurTimer = useRef(null);

  const selectedDateStr = useMemo(() => toDateStr(selectedDate), [selectedDate]);

  const loadDay = useCallback(async (dateStr) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('appointments')
      .select('id, appt_time, dokter, keluhan, status, patients(name)')
      .eq('appt_date', dateStr)
      .order('appt_time', { ascending: true });

    if (error) {
      console.error('Failed to load appointments for Calendar Appointment', error);
      toast.error('Gagal memuat jadwal appointment.');
      setAppointments([]);
      setLoading(false);
      return;
    }

    setAppointments(
      (data ?? [])
        .filter((row) => row.status !== 'Cancel')
        .map((row) => ({
          id: row.id,
          appt_time: row.appt_time?.slice(0, 5) ?? row.appt_time,
          dokter: row.dokter,
          keluhan: row.keluhan,
          patientName: row.patients?.name ?? '(Tidak diketahui)',
        }))
    );
    setLoading(false);
  }, []);

  const loadMonthDots = useCallback(async (cursor) => {
    const monthStart = toDateStr(startOfMonth(cursor));
    const monthEnd = toDateStr(addDays(addMonths(cursor, 1), -1));
    const { data, error } = await supabase
      .from('appointments')
      .select('appt_date')
      .gte('appt_date', monthStart)
      .lte('appt_date', monthEnd);
    if (error) {
      console.error('Failed to load month appointment dots', error);
      return;
    }
    setMonthDots(new Set((data ?? []).map((row) => row.appt_date)));
  }, []);

  useEffect(() => {
    loadDay(selectedDateStr);
  }, [selectedDateStr, loadDay]);

  useEffect(() => {
    loadMonthDots(calendarCursor);
  }, [calendarCursor, loadMonthDots]);

  function goToday() {
    const now = new Date();
    setSelectedDate(now);
    setCalendarCursor(startOfMonth(now));
  }

  function shiftDay(n) {
    setSelectedDate((prev) => {
      const next = addDays(prev, n);
      setCalendarCursor(startOfMonth(next));
      return next;
    });
  }

  function pickDay(date) {
    setSelectedDate(date);
  }

  const slots = useMemo(() => {
    const grid = buildHalfHourGrid(CLINIC_START, CLINIC_END);
    const real = appointments.map((a) => a.appt_time).filter(Boolean);
    const merged = Array.from(new Set([...grid, ...real])).sort();
    const breakIdx = merged.findIndex((t) => t >= '13:00');
    if (breakIdx === -1) return merged;
    return [...merged.slice(0, breakIdx), ISOMA, ...merged.slice(breakIdx)];
  }, [appointments]);

  function appointmentsAt(time) {
    return appointments.filter((a) => a.appt_time === time);
  }

  function openBookingFor(time, availableDoctors) {
    setBookingPrefill({
      date: selectedDateStr,
      time,
      doctor: availableDoctors[0] ?? '',
    });
    setBookingOpen(true);
  }

  const treatmentResults = useMemo(() => searchTreatmentPrices(treatmentQuery), [treatmentQuery]);
  const monthGrid = useMemo(() => buildMonthGrid(calendarCursor), [calendarCursor]);
  const dateLabel = `${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`;

  return (
    <div className="flex h-screen w-full flex-col bg-white">
      <header className="flex h-[64px] w-full shrink-0 items-center justify-between border-b border-black/[0.08] px-6">
        <div className="flex flex-1 items-center gap-[22px]">
          <button
            type="button"
            aria-label="Back"
            onClick={() => navigate('/patients')}
            className="flex size-6 items-center justify-center text-slate-700 hover:text-slate-900"
          >
            <ArrowLeft className="size-6" />
          </button>
          <h1 className="whitespace-nowrap text-lg font-bold text-[#050505]">Calendar Appointment</h1>
          <div className="flex items-center gap-3 pl-4">
            <button
              type="button"
              onClick={goToday}
              className="rounded-full bg-black/[0.04] px-3 py-2 text-sm text-[#636363] hover:bg-black/[0.07]"
            >
              Today
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous day"
                onClick={() => shiftDay(-1)}
                className="flex size-[30px] items-center justify-center rounded-full text-slate-500 hover:bg-black/[0.04]"
              >
                <ChevronLeft className="size-[18px]" />
              </button>
              <button
                type="button"
                aria-label="Next day"
                onClick={() => shiftDay(1)}
                className="flex size-[30px] items-center justify-center rounded-full text-slate-500 hover:bg-black/[0.04]"
              >
                <ChevronRight className="size-[18px]" />
              </button>
            </div>
          </div>
          <p className="whitespace-nowrap text-[22px] text-[#050505]">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Toggle theme"
            className="flex size-[30px] items-center justify-center rounded-full bg-black/[0.04] text-slate-500 hover:bg-black/[0.07]"
          >
            <Moon className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Notifications"
            className="flex size-[30px] items-center justify-center rounded-full bg-black/[0.04] text-slate-500 hover:bg-black/[0.07]"
          >
            <Bell className="size-4" />
          </button>
          <AccountMenu />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 items-start">
        {/* Sidebar */}
        <div className="flex h-full w-[256px] shrink-0 flex-col gap-6 overflow-y-auto border-r border-black/[0.08] px-3 py-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[#050505]">
                {MONTH_NAMES[calendarCursor.getMonth()]} {calendarCursor.getFullYear()}
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => setCalendarCursor((c) => addMonths(c, -1))}
                  className="flex size-4 items-center justify-center text-slate-500 hover:text-slate-800"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => setCalendarCursor((c) => addMonths(c, 1))}
                  className="flex size-4 items-center justify-center text-slate-500 hover:text-slate-800"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between">
                {DAY_LETTERS.map((l, i) => (
                  <div key={`${l}-${i}`} className="flex size-8 items-center justify-center rounded-full">
                    <span className="text-sm font-semibold text-[#636363]">{l}</span>
                  </div>
                ))}
              </div>
              {monthGrid.map((week, wi) => (
                <div key={wi} className="flex items-center justify-between">
                  {week.map(({ date, inMonth }) => {
                    const isSelected = sameDay(date, selectedDate);
                    const hasDot = monthDots.has(toDateStr(date));
                    return (
                      <button
                        type="button"
                        key={date.toISOString()}
                        onClick={() => pickDay(date)}
                        className={cn(
                          'relative flex size-8 items-center justify-center rounded-full text-sm',
                          isSelected
                            ? 'bg-[#1a73e8] font-semibold text-white'
                            : inMonth
                              ? 'text-[#050505] hover:bg-black/[0.05]'
                              : 'text-[#c4c7c5] hover:bg-black/[0.03]'
                        )}
                      >
                        {date.getDate()}
                        {hasDot && !isSelected && (
                          <span className="absolute bottom-[2px] size-[6px] rounded-full bg-[#f97316]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-b border-black/[0.08] py-4">
            <button
              type="button"
              onClick={() => setPromoOpen((v) => !v)}
              className="flex w-full items-center justify-between"
            >
              <span className="text-sm font-medium text-[#1f1f1f]">Promo &amp; Discount</span>
              {promoOpen ? (
                <ChevronUp className="size-4 text-slate-500" />
              ) : (
                <ChevronDown className="size-4 text-slate-500" />
              )}
            </button>
            {promoOpen &&
              PROMO_ITEMS.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="size-2.5 shrink-0 rounded-full bg-[#f97316]" />
                  <div className="flex min-w-0 flex-1 flex-col text-sm">
                    <span className="truncate text-[#1f1f1f]">{item.title}</span>
                    <span className="truncate text-xs text-[#636363]">{item.date}</span>
                  </div>
                </div>
              ))}
          </div>

          <button
            type="button"
            onClick={() => toast.info('Fitur Waiting List akan segera hadir.')}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-3xl border border-[#16a34a] bg-white text-sm font-medium text-[#636363] hover:bg-green-50/60"
          >
            <Clock className="size-4" />
            Add Waiting list
          </button>
        </div>

        {/* Main grid */}
        <div className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto">
          <div className="flex w-full items-stretch border-b border-black/[0.08] bg-white">
            <div className="flex w-[110px] shrink-0 items-center px-4 py-3">
              <p className="text-sm font-medium leading-tight text-[#050505]">
                Waktu
                <br />
                Appointment :
              </p>
            </div>
            <div className="flex w-[130px] shrink-0 items-center border-l border-black/[0.08] px-4 py-3">
              <p className="text-sm font-medium leading-tight text-[#050505]">
                Dokter
                <br />
                Tersedia :
              </p>
            </div>
            <div className="flex flex-1 items-center justify-between gap-4 border-l border-black/[0.08] px-4 py-3">
              <p className="whitespace-nowrap text-sm font-medium text-[#050505]">List Appointment :</p>
              <div className="relative w-full max-w-[260px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={treatmentQuery}
                  onChange={(e) => setTreatmentQuery(e.target.value)}
                  onFocus={() => {
                    if (blurTimer.current) clearTimeout(blurTimer.current);
                    setTreatmentFocused(true);
                  }}
                  onBlur={() => {
                    blurTimer.current = setTimeout(() => setTreatmentFocused(false), 150);
                  }}
                  placeholder="Cek Harga Treatment.."
                  className="h-9 w-full rounded-full border border-[#e6e5e3] bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-[#636363] focus:outline-none focus:ring-2 focus:ring-green-600/30"
                />
                {treatmentFocused && treatmentQuery.trim() && (
                  <div className="absolute right-0 top-full z-20 mt-1 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                    {treatmentResults.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-slate-400">Tidak ditemukan</p>
                    ) : (
                      treatmentResults.map((t) => (
                        <div
                          key={t.name}
                          className="flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50"
                        >
                          <span className="truncate text-slate-700">{t.name}</span>
                          <span className="shrink-0 font-medium text-slate-900">{formatRupiah(t.price)}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-1 items-center justify-center gap-2 py-16 text-sm text-slate-400">
              <Loader2 className="size-4 animate-spin" />
              Memuat jadwal...
            </div>
          ) : (
            slots.map((time) => {
              if (time === ISOMA) {
                return (
                  <div
                    key="isoma"
                    className="flex items-center border-b border-black/[0.08] bg-slate-50 px-4 py-2"
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Isoma (Istirahat)
                    </span>
                  </div>
                );
              }

              const atSlot = appointmentsAt(time);
              const bookedDoctors = new Set(atSlot.map((a) => a.dokter));
              const availableDoctors = DOCTORS.filter((d) => !bookedDoctors.has(d));
              const isFull = availableDoctors.length === 0;

              return (
                <div key={time} className="flex w-full items-stretch border-b border-black/[0.08]">
                  <div className="flex w-[110px] shrink-0 items-center justify-center py-4">
                    <span className="text-sm text-[#5f6368]">{time}</span>
                  </div>
                  <div className="flex w-[130px] shrink-0 flex-col items-start justify-center gap-1.5 border-l border-black/[0.08] px-3 py-3">
                    {isFull ? (
                      <DoctorPill muted>Full Appt</DoctorPill>
                    ) : (
                      availableDoctors.map((d) => <DoctorPill key={d}>{d}</DoctorPill>)
                    )}
                  </div>
                  <div className="flex flex-1 flex-wrap items-stretch gap-3 border-l border-black/[0.08] p-3">
                    {atSlot.map((appt) => (
                      <AppointmentCard key={appt.id} appt={appt} />
                    ))}
                    {!isFull && (
                      <button
                        type="button"
                        aria-label={`Buat appointment jam ${time}`}
                        onClick={() => openBookingFor(time, availableDoctors)}
                        className="flex size-9 shrink-0 items-center justify-center self-center rounded-full bg-black/[0.04] text-slate-500 hover:bg-black/[0.08] hover:text-green-700"
                      >
                        <PlusCircle className="size-[18px]" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <MakeAppointmentDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        onBooked={() => {
          loadDay(selectedDateStr);
          loadMonthDots(calendarCursor);
        }}
        prefill={bookingPrefill}
      />
    </div>
  );
}
