import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Professional multi-step progress indicator (green variant of the
 * "checkmark + halo" stepper style): a solid circle with a white checkmark
 * once a step is completed, a solid circle with a soft glowing halo ring
 * around it while a step is active, and a light outlined circle with a
 * small muted dot for steps not yet reached — joined by connector lines
 * that turn solid green only once the step before them is fully completed.
 *
 * @param {{ steps: string[], activeIndex: number, className?: string }} props
 */
export default function Stepper({ steps, activeIndex, className }) {
  return (
    <div className={cn('flex w-full items-start justify-center', className)}>
      {steps.map((label, index) => {
        const isCompleted = index < activeIndex;
        const isActive = index === activeIndex;
        const isReached = isCompleted || isActive;

        return (
          <div key={label} className="flex items-start">
            <div className="flex flex-col items-center gap-3 px-2">
              <div className="relative flex size-6 shrink-0 items-center justify-center">
                {isActive && (
                  <div
                    aria-hidden="true"
                    className="absolute -inset-1 rounded-full bg-[#16a34a]/15"
                  />
                )}
                <div
                  className={cn(
                    'relative flex size-6 shrink-0 items-center justify-center rounded-full transition-colors',
                    isReached ? 'bg-[#16a34a]' : 'border-2 border-[#e2e8f0] bg-white'
                  )}
                >
                  {isCompleted && <Check className="size-3 text-white" strokeWidth={3} />}
                  {isActive && <div className="size-1.5 rounded-full bg-white" />}
                  {!isReached && <div className="size-1.5 rounded-full bg-[#cbd5e1]" />}
                </div>
              </div>
              <span
                className={cn(
                  'whitespace-nowrap text-base font-semibold',
                  isCompleted && 'text-[#020617]',
                  isActive && 'text-[#16a34a]',
                  !isReached && 'text-[#94a3b8]'
                )}
              >
                {label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                className={cn(
                  'mt-3 h-[2px] w-16 shrink-0 sm:w-24',
                  isCompleted ? 'bg-[#16a34a]' : 'bg-[#e2e8f0]'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
