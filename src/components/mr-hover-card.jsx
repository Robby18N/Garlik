import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { MEDICAL_RISK_LEVELS } from '@/components/mr-check-icon';

// Same {label, description} pair MEDICAL_RISK_LEVELS carries for a real
// assessment (1/2/3) — `null` (no Doctor has assessed this patient yet)
// isn't one of those three levels, so it gets its own pair here rather
// than a fourth fake entry in MEDICAL_RISK_LEVELS itself (that array is
// also used to render the three actual selectable options in Registration
// and Edit Appointment's radio list, where "not assessed" isn't a choice).
function medicalRiskInfo(variant) {
  const level = MEDICAL_RISK_LEVELS.find((l) => l.value === variant);
  if (level) return { label: level.label, description: level.description };
  return { label: 'Belum dinilai', description: 'Belum dinilai oleh dokter.' };
}

/**
 * Hover tooltip for the "MR" (Medical Risk) column's check icon in
 * Today's Patient. Used to just be a native `title` attribute — a real
 * tooltip was asked for instead: a white card with a shadow and black
 * text, matching the look (not the content) of `PatientNameHoverCard`'s
 * tooltip on the Patient Name column next to it.
 *
 * This deliberately duplicates PatientNameHoverCard's hover/portal
 * mechanics (singleton exclusivity, `document.body` portal, `fixed`
 * positioning from `getBoundingClientRect()`) rather than importing or
 * generalizing that component — see its own file for the full history of
 * why it's built this way (stacked tooltips on rapid hover, Radix's portal
 * wrapper intercepting the mouse, the table's last row getting clipped by
 * `overflow-x-auto`'s implicit `overflow-y: auto`). Those fixes are
 * specific to "a non-interactive tooltip inside this particular table",
 * which applies here too, so the same approach is repeated rather than
 * risking a shared abstraction on top of a component that took several
 * rounds to get right.
 *
 * Props:
 *  - variant: 1 | 2 | 3 | null | undefined (required) — same MR variant
 *    MrCheckIcon renders, used here to look up which label/description to
 *    show
 *  - children: the trigger element (MrCheckIcon itself) shown inline;
 *    hovering/focusing it opens the tooltip
 */
let activeMrHoverCard = null;

export function MrHoverCard({ variant, children }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const closeTimer = useRef(null);
  const instanceRef = useRef({});
  const triggerRef = useRef(null);
  const { label, description } = medicalRiskInfo(variant);

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const releaseIfActive = () => {
    if (activeMrHoverCard === instanceRef.current) {
      activeMrHoverCard = null;
    }
  };

  const closeImmediate = () => {
    clearCloseTimer();
    setOpen(false);
    releaseIfActive();
  };

  const openNow = () => {
    clearCloseTimer();
    if (activeMrHoverCard && activeMrHoverCard !== instanceRef.current) {
      activeMrHoverCard.closeImmediate();
    }
    instanceRef.current.closeImmediate = closeImmediate;
    activeMrHoverCard = instanceRef.current;
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({ left: rect.left, top: rect.bottom + 8 });
    }
    setOpen(true);
  };

  const closeSoon = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => {
      setOpen(false);
      releaseIfActive();
    }, 150);
  };

  useEffect(() => {
    return () => {
      clearCloseTimer();
      releaseIfActive();
    };
  }, []);

  useLayoutEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({ left: rect.left, top: rect.bottom + 8 });
    }
  }, [open]);

  return (
    <span
      ref={triggerRef}
      className="inline-flex cursor-default items-center"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
      onFocus={openNow}
      onBlur={closeSoon}
      tabIndex={0}
    >
      {children}
      {open &&
        coords &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-50 w-max max-w-[240px] rounded-xl border border-[#e8ebed] bg-white p-3 text-sm text-[#0f172a] shadow-[0px_1px_4px_0px_rgba(0,0,0,0.05),0px_8px_24px_-2px_rgba(0,0,0,0.12)]"
            style={{ left: coords.left, top: coords.top }}
          >
            <p className="font-semibold">{label}</p>
            <p className="mt-0.5 text-[#334155]">{description}</p>
          </div>,
          document.body
        )}
    </span>
  );
}

export default MrHoverCard;
