import { useEffect, useState } from 'react';
import { ChevronDown, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { FieldLabel, TextField, SelectField, FieldRow } from '@/components/form-fields';
import { DOCTORS } from '@/context/role-context';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const ROOMS = ['R1', 'R2', 'R3'];
const DURATIONS = ['30 Min', '45 Min', '60 Min', '90 Min'];
const LAB_OPTIONS = ['-', 'OK', 'NOK'];

// Same shell styling as form-fields.jsx's TextField/SelectField (not
// exported from there) — used here only for the Status field, which needs
// per-option `disabled` (to respect the same role restriction as the
// table's inline Status dropdown) that the plain SelectField helper doesn't
// support.
const INPUT_SHELL =
  'flex min-h-9 w-full items-center gap-2 rounded-lg border border-solid border-[#e2e8f0] bg-white px-3 py-1.5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]';

// A handful of fields — Room, Est. Duration, Keluhan — get stored as the
// literal string "-" by the booking flows (make-appointment-dialog.jsx,
// Registration.jsx) when they're left blank or not yet relevant (e.g. an
// appointment booked for a future day, before its status/room/lab are
// meaningful). Treated here as "not filled in yet" rather than a real
// value, so the field opens blank (with its placeholder showing) and the
// user picks a real one, instead of silently keeping the placeholder dash.
function blankIfPlaceholder(value) {
  return value && value !== '-' ? value : '';
}

/**
 * Edit dialog behind Today's Patient table's pencil ("Edit") action — until
 * now that button was a no-op (`console.log`) with no way to actually
 * correct an appointment's Doctor/Room/Keluhan/Duration/Status/Lab from the
 * app itself. This is most needed for appointments that were booked for a
 * future day (so Status/Lab start out null/"-" and Room may too, per the
 * booking flows' own defaults) and have since become "today" without
 * anyone assigning them real values — see TodaysPatient's loadAppointments.
 *
 * Saves go straight to the `appointments` row in Supabase (by its id, which
 * is what TodaysPatient's mapped `patient.id` actually is) rather than any
 * local/session-only state, so the fix survives a reload and is visible to
 * every other login — unlike the table's own Status dropdown, which only
 * updates an in-memory override (see usePatientStatus/statusOverrides).
 * `onStatusSaved` lets the caller keep that override in sync immediately
 * instead of waiting on the follow-up refetch.
 */
export default function EditAppointmentDialog({
  open,
  onOpenChange,
  appointment,
  statusOptions,
  allowedStatusOptions,
  onSaved,
  onStatusSaved,
}) {
  const [dokter, setDokter] = useState('');
  const [room, setRoom] = useState('');
  const [keluhan, setKeluhan] = useState('');
  const [durasi, setDurasi] = useState('');
  const [status, setStatusField] = useState('');
  const [lab, setLab] = useState('-');
  const [saving, setSaving] = useState(false);

  // Re-seed the form fields every time a (possibly different) appointment
  // is opened for editing — appointment can change while the dialog is
  // already open only in theory, but this also correctly resets state each
  // time it's reopened for a new row.
  useEffect(() => {
    if (!open || !appointment) return;
    setDokter(appointment.dokter ?? '');
    setRoom(blankIfPlaceholder(appointment.room));
    setKeluhan(blankIfPlaceholder(appointment.keluhan));
    setDurasi(blankIfPlaceholder(appointment.durasi));
    setStatusField(appointment.status ?? '');
    setLab(appointment.lab || '-');
  }, [open, appointment]);

  async function handleSave() {
    const missing = [
      ['dokter', dokter, 'Doctor'],
      ['room', room, 'Room'],
      ['durasi', durasi, 'Est. Duration'],
      ['status', status, 'Status'],
    ].find(([, value]) => !value);
    if (missing) {
      toast.error(`Please fill in ${missing[2]}`);
      return;
    }

    setSaving(true);
    const patch = { dokter, room, keluhan: keluhan || '-', durasi, status, lab };
    // Stamp started_at the moment status becomes "In Treatment" from here
    // too — the live wait-time estimate on Today's Patient (see
    // lib/wait-estimate.js) needs a real timestamp regardless of whether
    // that transition happened via this dialog or the table's inline
    // Status dropdown. Only stamped on an actual transition into it, so
    // re-saving other fields while already "In Treatment" doesn't reset
    // the clock.
    if (status === 'In Treatment' && appointment.status !== 'In Treatment') {
      patch.started_at = new Date().toISOString();
    }
    const { error } = await supabase.from('appointments').update(patch).eq('id', appointment.id);
    setSaving(false);

    if (error) {
      console.error('Failed to update appointment', error);
      toast.error('Gagal menyimpan perubahan — coba lagi.');
      return;
    }

    toast.success(`Data appointment ${appointment.name} berhasil diperbarui`);
    // Keep the table's own ephemeral status override in sync right away —
    // otherwise it'd keep showing whatever the inline dropdown last set
    // (or nothing) until that override happened to get overwritten again,
    // masking this save even though the database is already correct.
    onStatusSaved?.(appointment.id, status);
    onSaved?.();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden rounded-2xl p-0 sm:max-w-lg">
        <DialogHeader className="gap-1 border-b border-[#e2e8f0] px-6 pt-5 pb-4">
          <DialogTitle className="text-base font-semibold text-[#020617]">
            Edit Appointment
          </DialogTitle>
          <DialogDescription className="text-sm text-[#64748b]">
            {appointment?.name} &middot; {appointment?.appt}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-6 py-5">
          <FieldRow className="flex-wrap">
            <SelectField
              label="Doctor"
              required
              options={DOCTORS}
              value={dokter}
              onChange={(e) => setDokter(e.target.value)}
              style={{ flexGrow: 160, flexBasis: '160px' }}
            />
            <SelectField
              label="Room"
              required
              options={ROOMS}
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              style={{ flexGrow: 160, flexBasis: '160px' }}
            />
          </FieldRow>

          <FieldRow className="flex-wrap">
            <SelectField
              label="Est. Duration"
              required
              options={DURATIONS}
              value={durasi}
              onChange={(e) => setDurasi(e.target.value)}
              style={{ flexGrow: 160, flexBasis: '160px' }}
            />
            <SelectField
              label="Lab"
              options={LAB_OPTIONS}
              value={lab}
              onChange={(e) => setLab(e.target.value)}
              style={{ flexGrow: 160, flexBasis: '160px' }}
            />
          </FieldRow>

          <FieldRow className="flex-wrap">
            <TextField
              label="Keluhan"
              placeholder="Type here.."
              value={keluhan}
              onChange={(e) => setKeluhan(e.target.value)}
              style={{ flexGrow: 260, flexBasis: '260px' }}
            />
          </FieldRow>

          <FieldRow className="flex-wrap">
            <div className="flex min-w-0 flex-col gap-1" style={{ flexGrow: 160, flexBasis: '160px' }}>
              <FieldLabel required>Status</FieldLabel>
              <div className={cn('relative', INPUT_SHELL)}>
                <select
                  value={status}
                  onChange={(e) => setStatusField(e.target.value)}
                  className="w-full min-w-0 appearance-none bg-transparent text-sm text-[#020617] focus:outline-none"
                >
                  <option value="" disabled hidden>
                    Select..
                  </option>
                  {statusOptions.map((option) => (
                    <option
                      key={option}
                      value={option}
                      disabled={!allowedStatusOptions.includes(option)}
                    >
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#64748b]" />
              </div>
            </div>
          </FieldRow>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#e2e8f0] px-6 py-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="min-h-9 rounded-lg border border-solid border-[#ef4444] px-6 py-2.5 text-sm font-medium text-[#ef4444] hover:bg-red-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#16a34a] px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save Changes
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
