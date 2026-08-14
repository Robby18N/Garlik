// Compact metric tile — icon chip + value/label pair. Originally built for
// the Doctor's minimalist Activity view (three of these replace the
// four-card expandable StatCard row, which reads as sparse once there's
// only ever one room's worth of data behind it). Extracted here so other
// single-doctor-scoped screens (Dashboard) can reuse the exact same tile
// instead of redefining it locally.
export default function StatPill({ icon, label, value }) {
  return (
    <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-semibold text-slate-900">{value}</span>
        <span className="text-xs text-slate-400">{label}</span>
      </div>
    </div>
  );
}
