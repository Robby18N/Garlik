import { useState } from 'react';
import { ChevronDown, NotebookPen, UsersRound, Users } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Mock data mirroring the Figma "Summary show & hide" component
// (node 469:4831). Sticky notes / waiting list / status patient counts
// and their detail breakdowns.
const STICKY_NOTES = ['Lantai Licin', 'Ada Lalat', 'Toilet', 'Design and chill', 'Listen to music'];

const WAITING_BY_DOCTOR = [
  { doctor: 'drg. SM', count: 7 },
  { doctor: 'drg. AN', count: 3 },
  { doctor: 'drg. DS', count: 3 },
];

const STATUS_BREAKDOWN = [
  { label: 'Waiting', value: 19, color: 'orange' },
  { label: 'Complete', value: 1, color: 'green' },
  { label: 'Late', value: 2, color: 'purple' },
  { label: 'Cancel', value: 2, color: 'red' },
];

const STATUS_BADGE_CLASS = {
  orange: 'border-transparent bg-[rgba(249,115,22,0.08)] text-[#f97316]',
  green: 'border-transparent bg-[rgba(34,197,94,0.08)] text-[#22c55e]',
  purple: 'border-transparent bg-[rgba(168,85,247,0.08)] text-[#a855f7]',
  red: 'border-transparent bg-[rgba(239,68,68,0.08)] text-[#ef4444]',
};

/**
 * Top-of-dashboard summary section: three stat cards (Sticky notes,
 * Waiting list, Status Patient) plus a "Show/Hide Detail Highlight"
 * toggle that expands a second row with the breakdown for each card.
 * Matches Figma node 469:4831. Manages its own expand/collapse state —
 * no props required.
 */
export default function SummaryCards() {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div className="flex w-full flex-col gap-3">
      <button
        type="button"
        onClick={() => setShowDetail((v) => !v)}
        className="flex items-center gap-1 self-end text-sm font-medium text-[#3b82f6] hover:underline"
      >
        {showDetail ? 'Hide Detail Highlight' : 'Show Detail Highlight'}
        <ChevronDown className={cn('size-4 transition-transform', showDetail && 'rotate-180')} />
      </button>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="flex-row items-center justify-center gap-2 rounded-[10px] border-slate-200 py-0 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] h-[60px]">
          <NotebookPen className="size-6 text-slate-700" />
          <p className="text-sm font-semibold text-[#020617]">
            Sticky notes <span className="text-[#16a34a]">(2)</span>
          </p>
        </Card>
        <Card className="flex-row items-center justify-center gap-2 rounded-[10px] border-slate-200 py-0 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] h-[60px]">
          <UsersRound className="size-6 text-slate-700" />
          <p className="text-sm font-semibold text-[#020617]">
            Waiting list <span className="text-[#16a34a]">(12)</span>
          </p>
        </Card>
        <Card className="flex-row items-center justify-center gap-2 rounded-[10px] border-slate-200 py-0 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] h-[60px]">
          <Users className="size-6 text-slate-700" />
          <p className="text-sm font-semibold text-[#020617]">
            Status Patient <span className="text-[#16a34a]">(30)</span>
          </p>
        </Card>
      </div>

      {showDetail && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Sticky notes detail */}
          <Card className="gap-2 rounded-[10px] border-slate-200 px-4 py-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2">
              <NotebookPen className="size-6 text-slate-700" />
              <p className="text-sm font-semibold text-[#020617]">Sticky notes</p>
            </div>
            <ul className="list-disc pl-5 text-[13px] text-[#020617]">
              {STICKY_NOTES.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </Card>

          {/* Waiting list detail */}
          <Card className="gap-2 rounded-[10px] border-slate-200 px-4 py-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2">
              <UsersRound className="size-6 text-slate-700" />
              <p className="text-sm font-semibold text-[#020617]">Waiting list</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {WAITING_BY_DOCTOR.map((item) => (
                <div
                  key={item.doctor}
                  className="flex flex-col items-start gap-0.5 rounded-2xl border border-slate-200 bg-amber-50/40 px-3 py-2 text-xs"
                >
                  <p className="text-[#020617]">{item.doctor}</p>
                  <p className="font-semibold text-[#020617]">{item.count} Patient Waiting list</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Status patient detail */}
          <Card className="gap-4 rounded-[10px] border-slate-200 px-4 py-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2">
              <Users className="size-6 text-slate-700" />
              <p className="text-sm font-semibold text-[#020617]">Status Patient</p>
            </div>
            <div className="flex items-start">
              {STATUS_BREAKDOWN.map((item, i) => (
                <div
                  key={item.label}
                  className={cn(
                    'flex flex-1 flex-col items-center justify-center gap-1 px-2',
                    i !== 0 && 'border-l border-slate-200'
                  )}
                >
                  <p className="text-2xl font-semibold tracking-tight text-[#171717]">{item.value}</p>
                  <Badge className={cn('rounded-full px-2.5 py-0.5', STATUS_BADGE_CLASS[item.color])}>
                    {item.label}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
