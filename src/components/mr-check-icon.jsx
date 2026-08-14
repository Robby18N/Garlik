import { Check, CheckCheck } from 'lucide-react';

import { cn } from '@/lib/utils';

// Triple / wave check — no direct lucide equivalent, built to match
// Figma's "check 3 1" icon (node 583:4808): three overlapping check
// strokes, blue, no background.
function CheckTriple({ className }) {
  return (
    <svg
      viewBox="0 0 20 16"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M1 8.5l2.2 2.2L8 5.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 8.5l2.2 2.2L13 5.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 8.5l2.2 2.2L18 5.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * MR column status icon — 3 variants. Variant 1 matches Figma node
 * 576:3190 ("check 1"): a single bold checkmark stroke, no badge/box,
 * brand blue (#3b82f6). Variants 2/3 match node 583:4809's "check 2 1"
 * (double-check) and "check 3 1" (triple/wave check), same blue.
 */
export default function MrCheckIcon({ variant = 2, className }) {
  if (variant === 1) {
    return <Check className={cn('size-4 shrink-0 text-[#3b82f6]', className)} strokeWidth={3} />;
  }

  if (variant === 3) {
    return <CheckTriple className={cn('size-4 shrink-0 text-[#3b82f6]', className)} />;
  }

  return <CheckCheck className={cn('size-4 shrink-0 text-[#3b82f6]', className)} strokeWidth={2.25} />;
}
