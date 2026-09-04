import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, UserPlus, ArrowLeft, Loader2, Plus, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn, resolveDayBucket } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { escapeIlike } from '@/lib/patients';
import { formatRupiah, getTreatmentPrice, searchTreatmentPrices } from '@/lib/treatment-prices';

const DOCTORS = ['drg. SM', 'drg. AN', 'drg. RF'];
const DURATIONS = ['30 Min', '45 Min', '60 Min', '90 Min'];

// Same room <-> doctor assignment already used across Dashboard/Activity's
// room-status widgets (R1 = drg. SM, R2 = drg. AN, R3 = drg. RF). The new
// "Buat Appointment" design (Figma node 820:649) dropped the separate Room
// selector, so the room is derived from whichever doctor gets picked
// instead of being asked for twice.
const ROOM_BY_DOCTOR = {
  'drg. SM': 'R1',
  'drg. AN': 'R2',
  'drg. RF': 'R3',
};

const initialAppointment = {
  doctor: '',
  keluhan: '',
  duration: '',
  date: '',
  time: '',
};

/**
 * Booking flow triggered by Calendar Appointment's per-slot "+" button —
 * distinct from "New Registration" because it's for a patient who's
 * already in the system: step 1 finds/selects that existing patient
 * (skipped when `preselectedPatient` is already known), step 2 captures
 * the appointment's remaining details. Date/time/room are never asked
 * here: date & time come from whichever slot the "+" was clicked on
 * (`prefill`), and room follows automatically from the chosen doctor.
 */
export default function MakeAppointmentDialog({
  open,
  onOpenChange,
  onBooked,
  preselectedPatient = null,
  // Optional { doctor, room, keluhan, duration, date, time } to seed step 2
  // with — used by Calendar Appointment's per-slot "+" button so a booking
  // started from a specific time slot doesn't make the receptionist retype
  // the date/time/doctor that slot already implies. Anything omitted just
  // falls back to initialAppointment's blank value as usual.
  prefill = null,
}) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [appointment, setAppointment] = useState(initialAppointment);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [booking, setBooking] = useState(false);
  const [keluhanFocused, setKeluhanFocused] = useState(false);
  const keluhanBlurTimer = useRef(null);

  // When opened from the "already registered" search-result popup, the
  // patient is already known — skip straight to step 1 (Detail Appointment)
  // instead of making the receptionist search for someone they just found.
  useEffect(() => {
    if (open && preselectedPatient) {
      setSelectedPatient(preselectedPatient);
      setStep(1);
    }
    // Only react to the dialog opening with a preselected patient — once
    // open, internal navigation (Ganti Pasien / Back) should take over.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preselectedPatient]);

  // Applies `prefill` fresh every time the dialog opens (not on every
  // keystroke afterwards — deliberately keyed on `open`/`prefill` only, so
  // once it's open the receptionist's own edits to these fields stick).
  useEffect(() => {
    if (open && prefill) {
      setAppointment((prev) => ({ ...prev, ...prefill }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefill]);

  // Searches the real `patients` table in Supabase — booking an appointment
  // is for a patient who's already in the system, so step 1 looks them up
  // directly in the database rather than against a local/hardcoded roster.
  // Debounced so it doesn't fire a request on every keystroke; with an
  // empty query it just shows the most recently registered patients, so the
  // list isn't blank the moment the dialog opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      const trimmed = query.trim();
      let request = supabase
        .from('patients')
        .select('id, mrn, name, phone, category')
        .order('created_at', { ascending: false })
        .limit(20);
      if (trimmed) {
        const esc = escapeIlike(trimmed);
        request = request.or(`name.ilike.%${esc}%,mrn.ilike.%${esc}%,phone.ilike.%${esc}%`);
      }
      const { data, error } = await request;
      if (cancelled) return;
      if (error) {
        console.error('Failed to search patients', error);
        setResults([]);
      } else {
        setResults(data ?? []);
      }
      setSearching(false);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, open]);

  // The new design auto-fills "Harga Treatment" straight from Keluhan —
  // same reference price list Calendar Appointment already shows on its
  // appointment cards and treatment search box.
  const estimatedPrice = useMemo(
    () => getTreatmentPrice(appointment.keluhan),
    [appointment.keluhan]
  );

  // Same suggestion list as Calendar Appointment's "Cek Harga Treatment"
  // search box — lets the receptionist pick a known treatment name (with
  // its price shown right there) instead of free-typing something that
  // might not match the price list at all.
  const keluhanSuggestions = useMemo(
    () => searchTreatmentPrices(appointment.keluhan),
    [appointment.keluhan]
  );

  function handleSelectKeluhanSuggestion(name) {
    if (keluhanBlurTimer.current) clearTimeout(keluhanBlurTimer.current);
    updateAppointment('keluhan', name);
    setKeluhanFocused(false);
  }

  function resetState() {
    setStep(0);
    setQuery('');
    setSelectedPatient(null);
    setAppointment(initialAppointment);
    setResults([]);
  }

  function handleOpenChange(next) {
    if (!next) resetState();
    onOpenChange(next);
  }

  function updateAppointment(field, value) {
    setAppointment((prev) => ({ ...prev, [field]: value }));
  }

  function handleSelectPatient(patient) {
    setSelectedPatient(patient);
  }

  function handleGoToRegistration() {
    handleOpenChange(false);
    navigate('/registration', { state: { flow: 'make-appointment' } });
  }

  function handleNext() {
    if (!selectedPatient) {
      toast.error('Pilih pasien terlebih dahulu');
      return;
    }
    setStep(1);
  }

  async function handleBook() {
    const required = [
      ['doctor', 'Doctor'],
      ['date', 'Appointment Date'],
      ['time', 'Appointment Time'],
    ];
    const missing = required.find(([field]) => !appointment[field]);
    if (missing) {
      toast.error(`Please fill in ${missing[1]}`);
      return;
    }

    setBooking(true);
    const { error } = await supabase.from('appointments').insert({
      patient_id: selectedPatient.id,
      appt_date: appointment.date,
      appt_time: appointment.time,
      dokter: appointment.doctor,
      room: ROOM_BY_DOCTOR[appointment.doctor] ?? '-',
      keluhan: appointment.keluhan || '-',
      durasi: appointment.duration || '-',
      // "Dalam Antrean" (neutral — no claimed elapsed time), not
      // "Waiting 10 Min": this patient hasn't waited any amount of time yet,
      // they were just booked. Staff bump it to "Waiting 10 Min"/"Waiting 20
      // Min" once that's actually true. See TodaysPatient's STATUS_STYLES.
      status: resolveDayBucket(appointment.date) === 'today' ? 'Dalam Antrean' : null,
      lab: '-',
      remark: '-',
    });
    setBooking(false);

    if (error) {
      console.error('Failed to create appointment', error);
      toast.error('Gagal membuat appointment — coba lagi.');
      return;
    }

    toast.success(
      `Appointment untuk ${selectedPatient.name} berhasil dibuat — ${appointment.date} ${appointment.time}`
    );
    // Today's Patient's table reads straight from Supabase now — tell it to
    // reload so this new appointment shows up immediately, instead of us
    // reconstructing a row locally and hoping it matches what the database
    // actually has.
    onBooked?.();
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="overflow-hidden rounded-[20px] p-0 sm:max-w-[560px]"
      >
        <DialogHeader className="relative gap-2 px-6 pt-6 pb-5">
          <DialogTitle className="text-[20px] font-semibold text-[#0f0d0a]">
            Buat Appointment
          </DialogTitle>
          <button
            type="button"
            aria-label="Close"
            onClick={() => handleOpenChange(false)}
            className="absolute right-6 top-6 flex size-7 items-center justify-center rounded-full bg-black/[0.03] text-[#0f0d0a] hover:bg-black/[0.06]"
          >
            <X className="size-3.5" />
          </button>
        </DialogHeader>
        <div className="h-px w-full shrink-0 bg-[#e2e8f0]" />

        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-6 py-5">
          {step === 0 ? (
            <>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari nama pasien, MRN, atau nomor telepon"
                  className="h-9 rounded-full border border-solid border-[#e2e8f0] bg-white pl-9 pr-8 text-sm"
                />
                {query && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              {searching && results.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-[#64748b]">
                  <Loader2 className="size-4 animate-spin" />
                  Mencari pasien...
                </div>
              ) : results.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#e2e8f0] px-6 py-8 text-center">
                  <p className="text-sm font-medium text-[#020617]">Pasien tidak ditemukan</p>
                  <p className="text-sm text-[#64748b]">
                    Pasien belum terdaftar di sistem. Silakan registrasi terlebih dahulu.
                  </p>
                  <Button
                    onClick={handleGoToRegistration}
                    className="h-9 rounded-full bg-gradient-to-r from-[#87c341] to-[#03a83d] text-sm font-medium text-white hover:opacity-90"
                  >
                    <UserPlus className="size-4" />
                    Registration and Make an Appointment
                  </Button>
                </div>
              ) : (
                <div className="flex max-h-[280px] flex-col gap-2 overflow-y-auto">
                  {results.map((patient) => {
                    const isSelected = selectedPatient?.id === patient.id;
                    return (
                      <button
                        type="button"
                        key={patient.id}
                        onClick={() => handleSelectPatient(patient)}
                        className={cn(
                          'flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors',
                          isSelected
                            ? 'border-green-600 bg-green-50/60'
                            : 'border-[#e2e8f0] bg-white hover:border-slate-300'
                        )}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-[#020617]">{patient.name}</span>
                          <span className="text-xs text-[#64748b]">
                            {patient.mrn} &middot; {patient.phone}
                          </span>
                        </div>
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-1 text-xs font-medium',
                            patient.category === 'VVIP' && 'bg-amber-50 text-amber-700',
                            patient.category === 'VIP' && 'bg-green-50 text-green-700',
                            patient.category === 'Regular' && 'bg-slate-100 text-slate-600'
                          )}
                        >
                          {patient.category}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex w-full items-center justify-between rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
                <div className="flex flex-col gap-1">
                  <p className="text-[16px] font-semibold text-[#0f0d0a]">{selectedPatient?.name}</p>
                  <p className="text-sm text-[#475569]">
                    {selectedPatient?.mrn}
                    {selectedPatient?.phone ? ` | ${selectedPatient.phone}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="flex shrink-0 items-center gap-1 rounded-md border border-[#e2e8f0] bg-white px-2 py-1 text-xs font-medium text-[#3b82f6] hover:bg-blue-50"
                >
                  <ArrowLeft className="size-3" />
                  Ganti Pasien
                </button>
              </div>

              <div className="flex w-full flex-col gap-2">
                <p className="flex items-center gap-0.5 text-sm font-medium text-[#0f0d0a]">
                  Doctor <span className="text-[#dc2626]">*</span>
                </p>
                <div className="flex h-[42px] w-full items-center gap-4 rounded-xl border border-[rgba(15,13,10,0.08)] px-4">
                  {DOCTORS.map((doctor) => (
                    <label
                      key={doctor}
                      className="flex cursor-pointer items-center gap-2 text-sm text-[#404040]"
                    >
                      <input
                        type="radio"
                        name="doctor"
                        className="size-4 accent-[#48a153]"
                        checked={appointment.doctor === doctor}
                        onChange={() => updateAppointment('doctor', doctor)}
                      />
                      {doctor}
                    </label>
                  ))}
                </div>
              </div>

              <div className="relative flex w-full flex-col gap-2">
                <p className="text-sm font-medium text-[#0f0d0a]">Keluhan</p>
                <textarea
                  rows={2}
                  value={appointment.keluhan}
                  onChange={(e) => updateAppointment('keluhan', e.target.value)}
                  onFocus={() => {
                    if (keluhanBlurTimer.current) clearTimeout(keluhanBlurTimer.current);
                    setKeluhanFocused(true);
                  }}
                  onBlur={() => {
                    keluhanBlurTimer.current = setTimeout(() => setKeluhanFocused(false), 150);
                  }}
                  placeholder="Type here.."
                  className="w-full resize-none rounded-xl border border-[#e2e8f0] bg-white p-3 text-sm text-[#0f0d0a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-green-600/20"
                />
                {/* Treatment-name autocomplete, same reference price list as
                    Calendar Appointment's "Cek Harga Treatment" search —
                    picking a suggestion fills Keluhan with that exact name
                    so "Harga Treatment" below resolves to an exact match. */}
                {keluhanFocused && appointment.keluhan.trim() && (
                  <div className="absolute left-0 top-full z-20 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                    {keluhanSuggestions.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-slate-400">Tidak ditemukan</p>
                    ) : (
                      keluhanSuggestions.map((t) => (
                        <button
                          type="button"
                          key={t.name}
                          onClick={() => handleSelectKeluhanSuggestion(t.name)}
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                        >
                          <span className="truncate text-slate-700">{t.name}</span>
                          <span className="shrink-0 font-medium text-slate-900">
                            {formatRupiah(t.price)}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="flex w-full flex-col gap-2">
                <p className="text-sm font-medium text-[#636363]">
                  Harga Treatment <span className="font-normal">(Otomatis terisi)</span>
                </p>
                <div className="w-full rounded-xl border border-[#e2e8f0] bg-[#f5f3f2] p-3 text-sm text-[#0f0d0a]">
                  {formatRupiah(estimatedPrice)}
                </div>
              </div>

              <div className="flex w-full flex-col gap-2">
                <p className="text-sm font-medium text-[#0f0d0a]">Est. Duration</p>
                <div className="relative flex h-[42px] w-full items-center rounded-xl border border-[#e2e8f0] bg-white px-4">
                  <select
                    value={appointment.duration}
                    onChange={(e) => updateAppointment('duration', e.target.value)}
                    className="w-full appearance-none bg-transparent text-sm text-[#0f0d0a] focus:outline-none"
                  >
                    <option value="" disabled>
                      Select..
                    </option>
                    {DURATIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 size-3.5 text-[#0f0d0a]" />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="h-px w-full shrink-0 bg-[#e2e8f0]" />
        <div className="flex items-center justify-between bg-[#faf9f9] px-5 py-5">
          <button
            type="button"
            onClick={() => (step === 0 ? handleOpenChange(false) : setStep(0))}
            className="rounded-xl border border-solid border-[#dc2626] bg-white px-6 py-3 text-sm font-semibold text-[#dc2626] hover:bg-red-50"
          >
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step === 0 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={results.length === 0}
              className="rounded-xl bg-[#48a153] px-6 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleBook}
              disabled={booking}
              className="inline-flex items-center gap-2 rounded-xl bg-[#48a153] px-6 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {booking ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
              Buat Appointment
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
