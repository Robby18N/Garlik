import { useEffect, useState } from 'react';
import { X, ChevronDown } from 'lucide-react';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const DOCTORS = ['drg. SM', 'drg. AN', 'drg. RF'];
const ROOMS = ['R1', 'R2', 'R3'];

// Falls back to this shape (matching Figma node 556:859's default state —
// SM and AN's Lab toggle on, RF's off) whenever the dialog is opened
// before any setting has ever been saved.
const DEFAULT_SETTINGS = {
  'drg. SM': { room: 'R1', lab: true },
  'drg. AN': { room: 'R1', lab: true },
  'drg. RF': { room: 'R1', lab: false },
};

/**
 * "Setting Room & Lab" popup (Figma node 556:859) opened from the Today's
 * Patient toolbar's "Rooms & Labs" button. Lets front-desk staff assign a
 * Room and toggle Lab availability per doctor; Save persists the mapping,
 * which the Today's Patient table then uses to auto-fill Tomorrow's Room
 * and Lab columns for every patient booked with that doctor.
 */
export default function SettingRoomLabDialog({ open, onOpenChange, settings, onSave }) {
  const [draft, setDraft] = useState(settings ?? DEFAULT_SETTINGS);

  // Re-seed the draft from the last-saved settings (or the design's default)
  // every time the dialog is opened, so an unsaved edit from a prior open
  // (that was cancelled) never leaks into the next one.
  useEffect(() => {
    if (open) {
      setDraft(settings ?? DEFAULT_SETTINGS);
    }
  }, [open, settings]);

  function updateRoom(doctor, room) {
    setDraft((prev) => ({ ...prev, [doctor]: { ...prev[doctor], room } }));
  }

  function updateLab(doctor, lab) {
    setDraft((prev) => ({ ...prev, [doctor]: { ...prev[doctor], lab } }));
  }

  function handleSave() {
    onSave(draft);
    onOpenChange(false);
  }

  function handleCancel() {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden rounded-2xl border-[#e8ebed] p-0 shadow-[0px_2px_8px_0px_rgba(0,0,0,0.06),0px_8px_32px_-4px_rgba(0,0,0,0.12)] sm:max-w-[420px]"
      >
        {/* Header */}
        <div className="flex w-full items-center justify-between bg-[#f7fafa] px-5 py-4">
          <p className="text-base font-semibold text-[#212933]">Setting Room &amp; Lab</p>
          <button
            type="button"
            onClick={handleCancel}
            aria-label="Close"
            className="flex size-7 items-center justify-center rounded-lg text-[#737d8c] hover:bg-black/5"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* Column headers */}
        <div className="flex w-full items-center justify-between bg-[#f5f5f7] px-5 py-2.5">
          <p className="w-[100px] shrink-0 text-xs font-semibold tracking-[0.04em] text-[#737d8c] uppercase">
            Doctor
          </p>
          <p className="w-[110px] shrink-0 text-xs font-semibold tracking-[0.04em] text-[#737d8c] uppercase">
            Room
          </p>
          <p className="w-16 shrink-0 text-right text-xs font-semibold tracking-[0.04em] text-[#737d8c] uppercase">
            Lab
          </p>
        </div>

        {/* Rows */}
        <div className="flex w-full flex-col">
          {DOCTORS.map((doctor, index) => {
            const row = draft[doctor] ?? DEFAULT_SETTINGS[doctor];
            return (
              <div
                key={doctor}
                className={cn(
                  'flex w-full items-center justify-between px-5 py-3',
                  index % 2 === 1 ? 'bg-[#fbfbfc]' : 'bg-white'
                )}
              >
                <p className="w-[100px] shrink-0 text-xs font-semibold text-[#737d8c]">{doctor}</p>

                <div className="w-[110px] shrink-0">
                  <div className="relative flex w-24 items-center justify-between rounded-lg border border-solid border-[#d9dbe0] bg-white px-2.5 py-1.5">
                    <select
                      value={row.room}
                      onChange={(e) => updateRoom(doctor, e.target.value)}
                      aria-label={`Room for ${doctor}`}
                      className="w-full min-w-0 appearance-none bg-transparent text-xs text-[#334155] focus:outline-none"
                    >
                      {ROOMS.map((room) => (
                        <option key={room} value={room}>
                          {room}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none size-4 shrink-0 text-[#737d8c]" />
                  </div>
                </div>

                <div className="flex w-16 shrink-0 items-center justify-end">
                  <Switch
                    checked={row.lab}
                    onCheckedChange={(checked) => updateLab(doctor, checked)}
                    aria-label={`Lab for ${doctor}`}
                    className="data-[state=checked]:bg-[#38a66b] data-[state=unchecked]:bg-[#d9dbe0]"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex w-full items-center justify-center gap-2.5 bg-[#f7fafa] px-5 py-3.5">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg border border-solid border-[#d9dbe0] bg-white px-5 py-2 text-[13px] font-medium text-[#666e7a] hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-[#38a66b] px-6 py-2 text-[13px] font-semibold text-white hover:bg-[#2f8f5c]"
          >
            Save
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
