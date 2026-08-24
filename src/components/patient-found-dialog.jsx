import { CalendarPlus, UserCheck } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useRole } from '@/context/role-context';

/**
 * "Found" counterpart to PatientNotFoundDialog — shown when the toolbar
 * search (Cari Pasien / ID Patient / Nomor Telp) doesn't match today's or
 * tomorrow's schedule, but DOES match someone in the broader registered-
 * patients master list. Mirrors Figma node 469:6139 ("Data patient not
 * regis") exactly in layout — same header, same dot-grid gradient panel,
 * same message + CTA shape — but for the opposite case: the patient is
 * already registered, they just aren't booked for today, so the CTA is
 * "Appointment" instead of "Registration and Make an Appointment". Doctor
 * can't book appointments (front-desk job), so they get a plain heads-up
 * with no CTA, same restriction as PatientNotFoundDialog.
 */
export default function PatientFoundDialog({ open, onOpenChange, patient, onBookAppointment }) {
  const { role } = useRole();
  const isDoctor = role === 'Doctor';

  function handleAppointment() {
    onOpenChange(false);
    onBookAppointment?.(patient);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden rounded-2xl p-0 sm:max-w-[500px]">
        <DialogHeader className="gap-1 px-6 pt-4 pb-4">
          <DialogTitle className="text-base font-medium text-black">
            Patient search results
          </DialogTitle>
          <DialogDescription className="text-sm text-[#64748b]">
            You can register patients, validate registered patients and make appointments here.
          </DialogDescription>
        </DialogHeader>

        <div className="relative flex flex-col items-center gap-6 border-t border-[#e2e8f0] bg-gradient-to-b from-white from-[29%] to-[#f8fafc] to-[85%] px-6 py-10">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
              backgroundSize: '14px 14px',
            }}
          />

          <div className="relative flex size-[120px] shrink-0 items-center justify-center overflow-clip rounded-full bg-gradient-to-b from-[#e8f7ee] to-[#d3f0dd]">
            <UserCheck className="size-14 text-[#03a83d]" strokeWidth={1.5} />
          </div>

          <div className="relative flex flex-col items-center gap-1 text-center">
            <p className="text-base font-bold text-[#020617]">Patient already registered</p>
            <p className="text-sm text-[#64748b]">
              {isDoctor
                ? 'This patient is registered but not scheduled today. Please ask the receptionist to book an appointment.'
                : 'This patient is registered but not scheduled today. Make an appointment for them below.'}
            </p>
            {patient && (
              <>
                <p className="text-sm font-medium text-[#020617]">
                  {patient.name} &middot; {patient.mrn}
                </p>
                {/* patient.lastVisit is undefined while the follow-up query
                    (TodaysPatient's runToolbarSearch/handleSelectSuggestion)
                    is still in flight, null once it resolves to "no real
                    visit on record", or {date, treatment} for a real one —
                    so this line simply doesn't render until there's an
                    actual answer, rather than flashing a placeholder. */}
                {patient.lastVisit !== undefined && (
                  <p className="text-xs text-[#64748b]">
                    {patient.lastVisit
                      ? `Kunjungan terakhir: ${patient.lastVisit.date}${
                          patient.lastVisit.treatment ? ` · ${patient.lastVisit.treatment}` : ''
                        }`
                      : 'Belum pernah berkunjung sebelumnya'}
                  </p>
                )}
              </>
            )}
          </div>

          {!isDoctor && (
            <button
              type="button"
              onClick={handleAppointment}
              className="relative flex min-h-9 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#87c341] to-[#03a83d] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              <CalendarPlus className="size-4" />
              Appointment
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
