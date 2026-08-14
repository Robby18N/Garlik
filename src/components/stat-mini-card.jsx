import { cn } from '@/lib/utils';

/**
 * Small flat overview stat card — icon chip + label + value, with an
 * optional muted subtext line. Matches the minimal/professional visual
 * language established in summary-cards.jsx (flat neutral icon chip,
 * subtle border, soft shadow) so it reads as the same design system on
 * every page, not a one-off.
 */
export default function StatMiniCard({ icon, label, value, sub, className }) {
  return (
    <div
      className={cn(
        'flex flex-1 items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-[0_1px_2px_0_rgba(0,0,0,0.04)]',
        className
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
        {icon}
      </div>
      <div className="flex min-w-0 flex-col">
        <p className="text-xl font-semibold leading-tight text-slate-900">{value}</p>
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        {sub && <p className="truncate text-[11px] text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}
