import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import patientNotFoundIllustration from '@/assets/patient-not-found-illustration.png';

/**
 * "No results" popup shown when the toolbar search (Cari Pasien / ID
 * Patient / Nomor Telp) doesn't match any patient — matches Figma node
 * 469:6139 ("Data patient not regis"): header + description, the
 * document + magnifying glass illustration, "Patient not yet registered"
 * message, and a gradient green CTA that routes into the registration +
 * appointment flow.
 */
export default function PatientNotFoundDialog({ open, onOpenChange }) {
  const navigate = useNavigate();

  function handleRegisterAndBook() {
    onOpenChange(false);
    navigate('/registration', { state: { flow: 'make-appointment' } });
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

          <div className="relative flex size-[120px] shrink-0 items-center justify-center overflow-clip">
            <img
              src={patientNotFoundIllustration}
              alt=""
              className="size-full object-contain"
            />
          </div>

          <div className="relative flex flex-col items-center gap-1 text-center">
            <p className="text-base font-bold text-[#020617]">Patient not yet registered</p>
            <p className="text-sm text-[#64748b]">
              Please register first, by clicking the button below.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRegisterAndBook}
            className="relative flex min-h-9 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#87c341] to-[#03a83d] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            <UserPlus className="size-4" />
            Registration and Make an Appointment
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
