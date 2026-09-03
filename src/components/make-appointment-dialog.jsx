import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, UserPlus, CalendarPlus, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Stepper from '@/components/stepper';
import { SelectField, TextField, DateField, FieldRow } from '@/components/form-fields';
import { cn, resolveDayBucket } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { escapeIlike } from '@/lib/patients';

const STEPS = ['Pilih Pasien', 'Detail Appointment'];

const DOCTORS = ['drg. SM', 'drg. AN', 'drg. RF'];
const ROOMS = ['R1', 'R2', 'R3'];
const DURATIONS = ['30 Min', '45 Min', '60 Min', '90 Min'];

const initialAppointment = {
  doctor: '',
  room: '',
  keluhan: '',
  duration: '',
  date: '',
  time: '',
};

/**
 * Booking flow behind Today's Patient's "+ Appointment" toolbar button —
 * distinct from "New Registration" because it's for a patient who's
 * already in the system: step 1 finds/selects that existing patient, step
 * 2 captures the appointment details (doctor/room/keluhan/duration/date/
 * time), matching the same fields Today's Patient's table itself displays.
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
      ['room', 'Room'],
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
      room: appointment.room,
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
      <DialogContent className="overflow-hidden rounded-2xl p-0 sm:max-w-xl">
        <DialogHeader className="gap-1 border-b border-[#e2e8f0] px-6 pt-5 pb-4">
          <DialogTitle className="text-base font-semibold text-[#020617]">
            Buat Appointment
          </DialogTitle>
          <DialogDescription className="text-sm text-[#64748b]">
            Cari pasien yang sudah terdaftar, lalu tentukan jadwal appointment-nya.
          </DialogDescription>
        </DialogHeader>

        <div className="relative flex items-center justify-center overflow-hidden border-b border-[#e2e8f0] py-5">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
              backgroundSize: '14px 14px',
            }}
          />
          <Stepper steps={STEPS} activeIndex={step} className="relative" />
        </div>

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
              <div className="flex items-center justify-between rounded-xl border border-[#e2e8f0] bg-slate-50/60 px-4 py-3">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#020617]">{selectedPatient?.name}</span>
                  <span className="text-xs text-[#64748b]">{selectedPatient?.mrn}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#3b82f6] hover:underline"
                >
                  <ArrowLeft className="size-3.5" />
                  Ganti Pasien
                </button>
              </div>

              <FieldRow className="flex-wrap">
                <SelectField
                  label="Doctor"
                  required
                  options={DOCTORS}
                  value={appointment.doctor}
                  onChange={(e) => updateAppointment('doctor', e.target.value)}
                  style={{ flexGrow: 160, flexBasis: '160px' }}
                />
                <SelectField
                  label="Room"
                  required
                  options={ROOMS}
                  value={appointment.room}
                  onChange={(e) => updateAppointment('room', e.target.value)}
                  style={{ flexGrow: 160, flexBasis: '160px' }}
                />
                <SelectField
                  label="Est. Duration"
                  options={DURATIONS}
                  value={appointment.duration}
                  onChange={(e) => updateAppointment('duration', e.target.value)}
                  style={{ flexGrow: 160, flexBasis: '160px' }}
                />
              </FieldRow>
              <FieldRow className="flex-wrap">
                <TextField
                  label="Keluhan"
                  placeholder="Type here.."
                  value={appointment.keluhan}
                  onChange={(e) => updateAppointment('keluhan', e.target.value)}
                  style={{ flexGrow: 260, flexBasis: '260px' }}
                />
              </FieldRow>
              <FieldRow className="flex-wrap">
                <DateField
                  label="Appointment Date"
                  required
                  iconPosition="right"
                  value={appointment.date}
                  onChange={(e) => updateAppointment('date', e.target.value)}
                  style={{ flexGrow: 200, flexBasis: '200px' }}
                />
                <TextField
                  label="Appointment Time"
                  required
                  type="time"
                  value={appointment.time}
                  onChange={(e) => updateAppointment('time', e.target.value)}
                  style={{ flexGrow: 200, flexBasis: '200px' }}
                />
              </FieldRow>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#e2e8f0] px-6 py-4">
          <button
            type="button"
            onClick={() => (step === 0 ? handleOpenChange(false) : setStep(0))}
            className="min-h-9 rounded-lg border border-solid border-[#ef4444] px-6 py-2.5 text-sm font-medium text-[#ef4444] hover:bg-red-50"
          >
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step === 0 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={results.length === 0}
              className="min-h-9 rounded-lg bg-[#16a34a] px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleBook}
              disabled={booking}
              className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#16a34a] px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {booking ? <Loader2 className="size-4 animate-spin" /> : <CalendarPlus className="size-4" />}
              Buat Appointment
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
