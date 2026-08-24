import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/utils';

// Category -> label color + chip background, matching the Figma "Hover Tooltip"
// component's category value color (VIP uses a dark green, e.g. #218c21).
// VVIP and Regular are inferred to keep the same visual language:
// gold/amber for the highest tier, green for VIP, slate for Regular.
const CATEGORY_STYLES = {
  VVIP: 'text-[#b45309]',
  VIP: 'text-[#218c21]',
  Regular: 'text-[#64748b]',
};

/**
 * Hoverable patient name used in the "Nama"/"Patient Name" table column.
 * On hover (or focus, for keyboard/touch users) it shows a small tooltip
 * with the patient's nickname and category badge, matching the Figma
 * "Hover Tooltip" component (node 555:869). The table cell itself shows
 * the full name; the "Nickname" line in the tooltip shows first name only.
 *
 * This used to be built on the shared Radix-based Popover
 * (@/components/ui/popover). Tried it hands-on by hovering down a column
 * of patient names in a real table and ran into problems that made the
 * experience feel broken, which shaped how this is built instead:
 *
 * 1. Every row renders its own independent instance. Moving the cursor
 *    from one name straight to the next fired the next instance's open
 *    handler immediately, while the previous instance was still mid-way
 *    through its own delayed close — so for a moment two tooltips were
 *    visibly stacked on top of each other. Fixed with `activeHoverCard`
 *    below: opening a new tooltip force-closes whichever other one is
 *    currently open, immediately, so at most one is ever mounted.
 *
 * 2. A table row is only ~40-45px tall, shorter than this tooltip, so an
 *    open tooltip unavoidably covers part of the row directly beneath the
 *    one it belongs to. Radix's Popover.Content renders into a portal
 *    wrapped in its own internal `[data-radix-popper-content-wrapper]`
 *    div — a plain `pointer-events-none` on our own content wasn't enough
 *    to let the mouse through, because that *wrapper* div (which we don't
 *    control) still captured the hover; confirmed with
 *    `document.elementFromPoint` while hovering, which kept returning the
 *    wrapper, never the row underneath. Moving the cursor down from one
 *    patient's name to the next kept re-triggering the tooltip a user was
 *    trying to leave instead of opening the next one.
 *
 * 3. Rendering the tooltip inline (`position: absolute` right next to the
 *    trigger, no portal at all) fixed #2, but broke on the table's *last*
 *    row: the table's horizontal-scroll wrapper sets `overflow-x-auto`,
 *    and per CSS's overflow rules, setting overflow on only one axis
 *    forces the other axis (here, vertical) to `auto` as well — so
 *    anything positioned outside that wrapper's box, like a tooltip
 *    hanging below the last row, got silently clipped.
 *
 * The fix that avoids all three: keep the tooltip non-interactive
 * (`pointer-events-none`, unconditionally — there's nothing to click or
 * read-by-hovering inside it, just two lines of text) and render it with
 * our own `createPortal` straight into `document.body`, positioned with
 * `position: fixed` from the trigger's own `getBoundingClientRect()`.
 * That escapes the overflow-clipping table wrapper (like Radix's portal
 * does) while staying a plain element we fully control, with no
 * intermediate wrapper div that could intercept the mouse (unlike
 * Radix's). `ui/popover.jsx` itself is untouched — TodaysPatient.jsx
 * still relies on it for two real *interactive* popovers (a remarks
 * thread and a name-search dropdown) that genuinely need to capture the
 * mouse, so that shared component was left alone rather than changed to
 * fit this one read-only use case.
 *
 * Props:
 *  - name: string (required) — patient's full/display name shown as the trigger; first name is used for the tooltip's Nickname line
 *  - category: 'VVIP' | 'VIP' | 'Regular' (required) — patient category shown in the tooltip
 */
let activeHoverCard = null;

export function PatientNameHoverCard({ name, category }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const closeTimer = useRef(null);
  const instanceRef = useRef({});
  const triggerRef = useRef(null);
  const categoryClass = CATEGORY_STYLES[category] ?? CATEGORY_STYLES.Regular;
  const firstName = name.trim().split(/\s+/)[0];

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const releaseIfActive = () => {
    if (activeHoverCard === instanceRef.current) {
      activeHoverCard = null;
    }
  };

  const closeImmediate = () => {
    clearCloseTimer();
    setOpen(false);
    releaseIfActive();
  };

  const openNow = () => {
    clearCloseTimer();
    // Force-close whichever other row's tooltip is currently open, right
    // away (no delay) — guarantees at most one tooltip is ever mounted
    // across the whole table, so there's nothing left to visually overlap
    // with this one as it opens.
    if (activeHoverCard && activeHoverCard !== instanceRef.current) {
      activeHoverCard.closeImmediate();
    }
    instanceRef.current.closeImmediate = closeImmediate;
    activeHoverCard = instanceRef.current;
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({ left: rect.left, top: rect.bottom + 8 });
    }
    setOpen(true);
  };

  const closeSoon = () => {
    clearCloseTimer();
    // Small delay so a brief flicker of the cursor off the name (e.g.
    // crossing a sub-pixel gap) doesn't instantly dismiss the tooltip.
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

  // Re-measure right before paint whenever the tooltip opens, in case the
  // row's position shifted between the mouse event and this render (e.g.
  // a table re-sort) — keeps the tooltip anchored to the actual name.
  useLayoutEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({ left: rect.left, top: rect.bottom + 8 });
    }
  }, [open]);

  return (
    <span className="relative inline-block">
      <span
        ref={triggerRef}
        className="cursor-default text-sm font-medium text-slate-700 underline decoration-dotted decoration-slate-300 underline-offset-4 hover:text-slate-900"
        onMouseEnter={openNow}
        onMouseLeave={closeSoon}
        onFocus={openNow}
        onBlur={closeSoon}
        tabIndex={0}
      >
        {name}
      </span>
      {open &&
        coords &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-50 w-max min-w-[150px] rounded-xl border border-[#e8ebed] bg-white p-4 text-[13px] shadow-[0px_1px_4px_0px_rgba(0,0,0,0.05),0px_4px_16px_-2px_rgba(0,0,0,0.1)]"
            style={{ left: coords.left, top: coords.top }}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <p className="w-20 shrink-0 font-normal text-[#737d8c]">Nickname</p>
                <p className="font-medium text-[#334155]">{`:  ${firstName}`}</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="w-20 shrink-0 font-normal text-[#737d8c]">Category</p>
                <p className={cn('font-semibold', categoryClass)}>{`:  ${category}`}</p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </span>
  );
}

export default PatientNameHoverCard;
