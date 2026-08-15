import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

// Shared visual language for every "summary card" row across the app
// (Today's Patient, Records, Activity) — a flat neutral icon chip and a
// soft card shadow, so the same component reads identically everywhere
// instead of each page inventing its own summary-card look.
export const CARD_CLASS = 'rounded-xl border border-slate-100 bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.04)]';
export const ICON_CHIP_CLASS = 'flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500';

// Height and opacity animate on different clocks: the height eases over a
// slightly longer, natural duration while the opacity fades out quickly.
// Without this split, a fading block visibly "squishes" as it shrinks
// (text compressing into a shorter box before it's fully gone) — running
// opacity faster than height means the content is already invisible well
// before the box finishes collapsing, which is what actually reads as a
// smooth collapse rather than a jump cut.
export const DETAIL_TRANSITION = {
  height: { duration: 0.32, ease: [0.4, 0, 0.2, 1] },
  opacity: { duration: 0.16, ease: 'easeIn' },
};
export const FADE_TRANSITION = { duration: 0.18, ease: [0.4, 0, 0.2, 1] };

/** One stat card: a persistent header row (icon + title + a count pill that
 * only shows while collapsed) plus a detail section that expands/collapses
 * in place via a real height animation — the same card grows and shrinks
 * rather than being swapped for a differently-shaped one, which is what
 * makes both the show *and* the hide direction read as smooth.
 *
 * Originally built for Today's Patient's summary row; extracted here so
 * Records and Activity's overview cards can share the exact same format
 * instead of a different (flatter, always-expanded) mini-card style.
 */
export function StatCard({ icon, title, count, showDetail, children, minHeight = 110 }) {
  return (
    <div className={cn(CARD_CLASS, 'min-w-[220px] flex-1 overflow-hidden')}>
      <div className="flex h-11 shrink-0 items-center gap-2.5 px-4">
        <div className={ICON_CHIP_CLASS}>{icon}</div>
        <p className="text-sm font-medium text-slate-700">{title}</p>
        <AnimatePresence initial={false}>
          {!showDetail && (
            <motion.span
              key="count"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={FADE_TRANSITION}
              className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600"
            >
              {count}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {showDetail && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={DETAIL_TRANSITION}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 px-4 pb-4" style={{ minHeight }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** The "Show/Hide Detail Highlight" link-style toggle shown above a row of
 * StatCards — same control on every page that uses the row. */
export function DetailHighlightToggle({ expanded, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-1.5 self-end text-sm font-medium text-[#3b82f6] hover:underline"
    >
      {expanded ? 'Hide Detail Highlight' : 'Show Detail Highlight'}
      <ChevronDown className={cn('size-4 transition-transform duration-200', expanded && 'rotate-180')} />
    </button>
  );
}

export default StatCard;
