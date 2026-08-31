import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ClipboardList, ClipboardCheck, ShieldAlert } from 'lucide-react';

import { flaggedConditionLabels } from '@/lib/screening-fields';

// The "Skrining" column's icon + hover tooltip in Today's Patient — this is
// the other end of the Screening page (src/pages/Screening.jsx): once a
// receptionist finishes a patient's initial screening there, the result
// shows up here so a Doctor sees it without having to open a separate menu.
//
// `screening` is the row Today's Patient already fetched from the
// `screenings` table for this appointment (see TodaysPatient.jsx's
// loadAppointments) — null/undefined means no screening exists yet for
// this visit.
//
// Duplicates the hover/portal mechanics already proven in
// PatientNameHoverCard and MrHoverCard (singleton exclusivity so rapid
// hovering across rows never stacks tooltips, `document.body` portal,
// `fixed` positioning from `getBoundingClientRect()`) rather than
// generalizing a shared component — see mr-hover-card.jsx for why that
// tradeoff was made deliberately here.
let activeScreeningHoverCard = null;

function screeningInfo(screening) {
  if (!screening) {
    return {
      Icon: ClipboardList,
      color: '#94a3b8',
      title: 'Belum Skrining',
      body: 'Pasien belum menjalani skrining awal hari ini.',
    };
  }

  const flagged = flaggedConditionLabels(screening.conditions);
  const vitalsParts = [
    screening.suhu ? `Suhu ${screening.suhu}°C` : null,
    screening.tensi ? `Tensi ${screening.tensi} mmHg` : null,
  ].filter(Boolean);
  const vitalsLine = vitalsParts.join(' · ');

  if (flagged.length > 0) {
    return {
      Icon: ShieldAlert,
      color: '#ef4444',
      title: 'Kondisi Khusus Ditemukan',
      body: [
        flagged.join(', '),
        vitalsLine || null,
        screening.notes || null,
      ]
        .filter(Boolean)
        .join('\n'),
    };
  }

  return {
    Icon: ClipboardCheck,
    color: '#16a34a',
    title: 'Skrining Selesai',
    body: [
      'Tidak ada kondisi khusus ditemukan.',
      vitalsLine || null,
    ]
      .filter(Boolean)
      .join('\n'),
  };
}

export function ScreeningStatusCell({ screening }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const closeTimer = useRef(null);
  const instanceRef = useRef({});
  const triggerRef = useRef(null);
  const { Icon, color, title, body } = screeningInfo(screening);

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const releaseIfActive = () => {
    if (activeScreeningHoverCard === instanceRef.current) {
      activeScreeningHoverCard = null;
    }
  };

  const closeImmediate = () => {
    clearCloseTimer();
    setOpen(false);
    releaseIfActive();
  };

  const openNow = () => {
    clearCloseTimer();
    if (activeScreeningHoverCard && activeScreeningHoverCard !== instanceRef.current) {
      activeScreeningHoverCard.closeImmediate();
    }
    instanceRef.current.closeImmediate = closeImmediate;
    activeScreeningHoverCard = instanceRef.current;
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
      <Icon className="size-4" style={{ color }} />
      {open &&
        coords &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-50 w-max max-w-[260px] rounded-xl border border-[#e8ebed] bg-white p-3 text-sm text-[#0f172a] shadow-[0px_1px_4px_0px_rgba(0,0,0,0.05),0px_8px_24px_-2px_rgba(0,0,0,0.12)]"
            style={{ left: coords.left, top: coords.top }}
          >
            <p className="font-semibold">{title}</p>
            <p className="mt-0.5 whitespace-pre-line text-[#334155]">{body}</p>
          </div>,
          document.body
        )}
    </span>
  );
}

export default ScreeningStatusCell;
