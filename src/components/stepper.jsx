import { cn } from '@/lib/utils';

/**
 * Professional multi-step progress indicator matching Figma's "Step Shape"
 * component (node 469:2378/469:2381/469:2385): a 40px circle with a 2px
 * border — filled with a small solid dot when active/completed — joined
 * by a 3px connector line, with a bold label under the active step and a
 * muted label under steps not yet reached.
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
            <div className="flex flex-col items-center gap-2 px-3">
              <div
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-[20px] border-2',
                  isReached ? 'border-[#16a34a]' : 'border-[#cfd6dc]'
                )}
              >
                {isReached && <div className="size-4 rounded-[10px] bg-[#16a34a]" />}
              </div>
              <span
                className={cn(
                  'whitespace-nowrap text-base font-semibold',
                  isReached ? 'text-[#020617]' : 'text-[#cbd5e1]'
                )}
              >
                {label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                className={cn(
                  'mt-5 h-[3px] w-24 shrink-0 sm:w-32',
                  isReached ? 'bg-[#16a34a]' : 'bg-[#cfd6dc]'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
