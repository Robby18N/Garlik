import { Check, CheckCheck, CircleHelp } from 'lucide-react';

import { cn } from '@/lib/utils';

// Triple / wave check — no direct lucide equivalent, built to match
// Figma's "check 3 1" icon (node 583:4808): three overlapping check
// strokes, blue, no background.
function CheckTriple({ className }) {
  return (
    <svg
      viewBox="0 0 20 16"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M1 8.5l2.2 2.2L8 5.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 8.5l2.2 2.2L13 5.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 8.5l2.2 2.2L18 5.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// What each MR variant actually means, per the clinic's own definition —
// only a Doctor can set this (see TodaysPatient's EditAppointmentDialog
// wiring and Registration's Medical Record step), and it lives on the
// *patient* record so it follows them across every appointment, not just
// this one. Exported so both the table cell's tooltip and the Edit/
// Registration forms describe the exact same three levels, and never drift
// out of sync with each other.
export const MEDICAL_RISK_LEVELS = [
  {
    value: 1,
    label: 'Tidak ada riwayat',
    description: 'Pasien tidak memiliki riwayat penyakit apapun — aman untuk tindakan medis apapun.',
  },
  {
    value: 2,
    label: 'Ada riwayat, masih aman',
    description:
      'Pasien memiliki riwayat penyakit tertentu, tapi masih aman untuk dilakukan tindakan apapun.',
  },
  {
    value: 3,
    label: 'Perlu perhatian khusus',
    description:
      'Pasien memiliki riwayat penyakit yang tidak boleh sembarangan diberi obat atau tindakan operasi — perlu perhatian khusus.',
  },
];

export function medicalRiskDescription(variant) {
  if (variant == null) return 'Belum dinilai oleh dokter.';
  return MEDICAL_RISK_LEVELS.find((l) => l.value === variant)?.description ?? 'Belum dinilai oleh dokter.';
}

/**
 * MR ("Medical Risk") column icon — reflects a Doctor's own clinical
 * assessment of the patient's history, per MEDICAL_RISK_LEVELS above.
 * Variant 1 matches Figma node 576:3190 ("check 1"): a single bold
 * checkmark stroke, no badge/box, brand blue (#3b82f6). Variants 2/3 match
 * node 583:4809's "check 2 1" (double-check) and "check 3 1" (triple/wave
 * check), same blue. `variant` of null/undefined — a patient no Doctor has
 * assessed yet — renders as a neutral gray "?" instead of silently
 * defaulting to any of the three real levels, since defaulting to e.g.
 * "no history, safe" would be a false clinical claim nobody actually made.
 */
export default function MrCheckIcon({ variant, className }) {
  if (variant === 1) {
    return <Check className={cn('size-4 shrink-0 text-[#3b82f6]', className)} strokeWidth={3} />;
  }

  if (variant === 2) {
    return <CheckCheck className={cn('size-4 shrink-0 text-[#3b82f6]', className)} strokeWidth={2.25} />;
  }

  if (variant === 3) {
    return <CheckTriple className={cn('size-4 shrink-0 text-[#3b82f6]', className)} />;
  }

  return <CircleHelp className={cn('size-4 shrink-0 text-[#94a3b8]', className)} strokeWidth={2} />;
}
