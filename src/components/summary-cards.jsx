import { useState } from 'react';
import { ChevronDown, NotebookPen, UsersRound, Users } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Mock data matching the Figma "Summary show & hide" component exactly
// (Show state: node 583:4311, Hide state: node 583:4583).
const STICKY_NOTES = ['Lantai Licin', 'Ada Lalat', 'Toilet'];

const WAITING_BY_DOCTOR = [
  { doctor: 'drg. SM', count: 7 },
  { doctor: 'drg. DS', count: 3 },
  { doctor: 'drg. AN', count: 3 },
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
 * Matches Figma nodes 583:4311 (Show/collapsed) and 583:4583
 * (Hide/expanded). Manages its own expand/collapse state — no props
 * required.
 */
export default function SummaryCards() {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div className="flex w-full flex-col gap-3">
      <button
        type="button"
        onClick={() => setShowDetail((v) => !v)}
        className="flex items-center gap-2 self-end text-sm font-medium text-[#3b82f6] hover:underline"
      >
        {showDetail ? 'Hide Detail Highlight' : 'Show Detail Highlight'}
        <ChevronDown className={cn('size-6 transition-transform', showDetail && 'rotate-180')} />
      </button>

      {!showDetail && (
        <div className="flex w-full items-center justify-center gap-4">
          <Card className="h-[42px] w-[438px] shrink-0 flex-row items-center justify-start gap-2 rounded-[10px] border-slate-200 px-5 py-0 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <NotebookPen className="size-5 text-slate-700" />
            <p className="text-sm font-semibold text-[#020617]">
              Sticky notes <span className="text-[#16a34a]">({STICKY_NOTES.length})</span>
            </p>
          </Card>
          <Card className="h-[42px] flex-1 flex-row items-center justify-start gap-2 rounded-[10px] border-slate-200 px-5 py-0 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <UsersRound className="size-5 text-slate-700" />
            <p className="text-sm font-semibold text-[#020617]">
              Waiting list <span className="text-[#16a34a]">(12)</span>
            </p>
          </Card>
          <Card className="h-[42px] flex-1 flex-row items-center justify-start gap-2 rounded-[10px] border-slate-200 px-5 py-0 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <Users className="size-5 text-slate-700" />
            <p className="text-sm font-semibold text-[#020617]">
              Status Patient <span className="text-[#15803d]">(30)</span>
            </p>
          </Card>
        </div>
      )}

      {showDetail && (
        <div className="flex w-full items-stretch gap-4">
          {/* Sticky notes detail */}
          <Card className="h-[144px] flex-1 gap-3 rounded-[10px] border-slate-200 px-4 py-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2">
              <NotebookPen className="size-6 text-slate-700" />
              <p className="text-sm font-semibold text-[#020617]">Sticky notes</p>
            </div>
            <ul className="list-disc pl-5 text-[13px] tracking-wide text-[#020617]">
              {STICKY_NOTES.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </Card>

          {/* Waiting list detail */}
          <Card className="h-[144px] flex-1 gap-2 overflow-y-auto rounded-[10px] border-slate-200 px-4 py-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2">
              <UsersRound className="size-6 text-slate-700" />
              <p className="text-sm font-semibold text-[#020617]">Waiting list</p>
            </div>
            <div className="flex flex-col gap-2">
              {WAITING_BY_DOCTOR.map((item) => (
                <div
                  key={item.doctor}
                  className="flex items-center justify-between gap-[3px] rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-amber-50 px-3 py-2 text-xs"
                >
                  <p className="text-[#020617]">{item.doctor}</p>
                  <p className="font-semibold text-black">{item.count} Patient Waiting list</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Status patient detail */}
          <Card className="h-[144px] flex-1 justify-between gap-4 rounded-[10px] border-slate-200 px-4 py-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2">
              <Users className="size-6 text-slate-700" />
              <p className="text-sm font-semibold text-[#020617]">Status Patient</p>
            </div>
            <div className="flex items-start">
              {STATUS_BREAKDOWN.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-1 flex-col items-center justify-center gap-1 border-r border-slate-200 px-2 first:border-l"
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
