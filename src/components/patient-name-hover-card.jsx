import { useState } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
 * On hover (or focus, for keyboard/touch users) it shows a small popover
 * with the patient's nickname and category badge, matching the Figma
 * "Hover Tooltip" component (node 555:869). The table cell itself shows
 * the full name; the "Nickname" line in the popover shows first name only.
 *
 * Props:
 *  - name: string (required) — patient's full/display name shown as the trigger; first name is used for the popover's Nickname line
 *  - category: 'VVIP' | 'VIP' | 'Regular' (required) — patient category shown in the popover
 */
export function PatientNameHoverCard({ name, category }) {
  const [open, setOpen] = useState(false);
  const categoryClass = CATEGORY_STYLES[category] ?? CATEGORY_STYLES.Regular;
  const firstName = name.trim().split(/\s+/)[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span
          className="cursor-default text-sm font-medium text-slate-700 underline decoration-dotted decoration-slate-300 underline-offset-4 hover:text-slate-900"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          tabIndex={0}
        >
          {name}
        </span>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-auto rounded-xl border border-[#e8ebed] p-4 text-[13px] shadow-[0px_1px_4px_0px_rgba(0,0,0,0.05),0px_4px_16px_-2px_rgba(0,0,0,0.1)]"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
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
      </PopoverContent>
    </Popover>
  );
}

export default PatientNameHoverCard;
