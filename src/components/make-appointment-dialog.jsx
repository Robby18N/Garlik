import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, UserPlus, CalendarPlus, ArrowLeft } from 'lucide-react';
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

const STEPS = ['Pilih Pasien', 'Detail Appointment'];

// Small mock roster of already-registered patients this dialog searches
// against — booking an appointment is for an existing patient, unlike the
// "New Registration" button which creates a brand new record.
const REGISTERED_PATIENTS = [
  { id: 1, name: 'Agung Wijaya Kusuma', mrn: 'P-0001', phone: '0813-2037-6091', category: 'VIP' },
  { id: 2, name: 'Siti Rahmawati', mrn: 'P-0002', phone: '0821-2074-6182', category: 'Regular' },
  { id: 3, name: 'Budi Santoso', mrn: 'P-0003', phone: '0822-2111-6273', category: 'Regular' },
  { id: 4, name: 'Dewi Lestari', mrn: 'P-0004', phone: '0851-2148-6364', category: 'VVIP' },
  { id: 5, name: 'Andi Pratama', mrn: 'P-0005', phone: '0852-2185-6455', category: 'Regular' },
  { id: 6, name: 'Rina Marlina', mrn: 'P-0006', phone: '0895-2222-6546', category: 'VIP' },
  { id: 7, name: 'Fajar Hidayat', mrn: 'P-0007', phone: '0896-2259-6637', category: 'Regular' },
  { id: 8, name: 'Nur Aisyah', mrn: 'P-0008', phone: '0812-2296-6728', category: 'Regular' },
];

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
export default function MakeAppointmentDialog({ open, onOpenChange, onBooked, extraPatients = [] }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [appointment, setAppointment] = useState(initialAppointment);

  // Patients registered at runtime (via "New Registration") aren't in this
  // dialog's own seeded roster, but they're just as bookable — merge them
  // in so booking a follow-up appointment for someone registered five
  // minutes ago doesn't require registering them all over again. New ones
  // are searched first since they're the most likely thing a receptionist
  // is looking for right after registering someone.
  const allPatients = useMemo(
    () => [...extraPatients, ...REGISTERED_PATIENTS],
    [extraPatients]
  );

  const trimmed = query.trim().toLowerCase();
  const results = trimmed
    ? allPatients.filter(
        (p) =>
          p.name.toLowerCase().includes(trimmed) ||
          p.mrn.toLowerCase().includes(trimmed) ||
          p.phone.replace(/-/g, '').includes(trimmed.replace(/-/g, ''))
      )
    : allPatients;

  function resetState() {
    setStep(0);
    setQuery('');
    setSelectedPatient(null);
    setAppointment(initialAppointment);
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

  function handleBook() {
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
    // Feed the new appointment straight into Today's Patient's table — same
    // page, so this is a direct callback rather than router state (that
    // trick is only needed for Registration, which is a full page nav).
    onBooked?.(
      {
        mr: 2,
        appt: appointment.time,
        name: selectedPatient.name,
        category: selectedPatient.category,
        dokter: appointment.doctor,
        room: appointment.room,
        keluhan: appointment.keluhan || '-',
        durasi: appointment.duration || '-',
        status: 'Waiting 10 Min',
        lab: '-',
        remark: '-',
        phone: selectedPatient.phone,
      },
      resolveDayBucket(appointment.date)
    );

    toast.success(
      `Appointment untuk ${selectedPatient.name} berhasil dibuat — ${appointment.date} ${appointment.time}`
    );
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

              {results.length === 0 ? (
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
              className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#16a34a] px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700"
            >
              <CalendarPlus className="size-4" />
              Buat Appointment
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
