import { ChevronDown, CalendarDays, Upload } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Shared registration-form field primitives matching Figma's Input /
 * Select & Combobox component styling exactly (node 469:2356 and its
 * nested Input Field instances): white background, 1px #e2e8f0 border,
 * 8px radius, a soft xs shadow, 36px min-height, 14px label above with a
 * red "*" for required fields.
 *
 * Every field also accepts `style` so callers can give it a Figma-accurate
 * proportional width via flexGrow/flexBasis inside a flex row, instead of
 * forcing every field in a row to the same width.
 */

export function FieldLabel({ children, required }) {
  return (
    <p className="whitespace-nowrap text-sm font-medium text-[#020617]">
      {children}
      {required && <span className="text-[#b91c1c]"> *</span>}
    </p>
  );
}

const INPUT_SHELL =
  'flex min-h-9 w-full items-center gap-2 rounded-lg border border-solid border-[#e2e8f0] bg-white px-3 py-1.5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]';

const INPUT_SHELL_DISABLED =
  'flex min-h-9 w-full items-center gap-2 rounded-lg border border-solid border-[#e2e8f0] bg-[#f1f5f9] px-3 py-1.5 opacity-50';

export function TextField({ label, required, disabled, className, style, ...props }) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)} style={style}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className={disabled ? INPUT_SHELL_DISABLED : INPUT_SHELL}>
        <input
          disabled={disabled}
          className="w-full min-w-0 bg-transparent text-sm text-[#020617] placeholder:text-[#64748b] focus:outline-none disabled:cursor-not-allowed"
          {...props}
        />
      </div>
    </div>
  );
}

export function SelectField({
  label,
  required,
  disabled,
  className,
  style,
  placeholder = 'Select..',
  options = [],
  ...props
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)} style={style}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className={cn('relative', disabled ? INPUT_SHELL_DISABLED : INPUT_SHELL)}>
        <select
          disabled={disabled}
          defaultValue=""
          className={cn(
            'w-full min-w-0 appearance-none bg-transparent text-sm focus:outline-none disabled:cursor-not-allowed',
            'text-[#020617] invalid:text-[#64748b]'
          )}
          {...props}
        >
          <option value="" disabled hidden className="text-[#64748b]">
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt} value={opt} className="text-[#020617]">
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#64748b]" />
      </div>
    </div>
  );
}

export function DateField({
  label,
  required,
  disabled,
  className,
  style,
  iconPosition = 'left',
  ...props
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)} style={style}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className={cn('relative', disabled ? INPUT_SHELL_DISABLED : INPUT_SHELL)}>
        {iconPosition === 'left' && (
          <CalendarDays className="size-4 shrink-0 text-[#64748b]" />
        )}
        <input
          type="date"
          disabled={disabled}
          className={cn(
            'w-full min-w-0 bg-transparent text-sm text-[#334155] focus:outline-none disabled:cursor-not-allowed [&::-webkit-calendar-picker-indicator]:opacity-0',
            iconPosition === 'right' && 'pr-5'
          )}
          {...props}
        />
        {iconPosition === 'right' && (
          <CalendarDays className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#64748b]" />
        )}
      </div>
    </div>
  );
}

export function UploadField({ label, fileName, onFileChange, className, style }) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)} style={style}>
      <FieldLabel>{label}</FieldLabel>
      <label className={cn(INPUT_SHELL, 'cursor-pointer gap-2')}>
        <span className="flex shrink-0 items-center gap-1 font-medium text-[#3b82f6]">
          <Upload className="size-3.5" />
          Upload here..
        </span>
        <span className="truncate text-sm text-[#334155]">
          {fileName || 'No file chosen'}
        </span>
        <input type="file" className="hidden" onChange={onFileChange} />
      </label>
    </div>
  );
}

/** Section header matching Figma's "Head Section" — a small semibold
 * tertiary-gray label, with a top divider for every section after the
 * first. */
export function SectionHeader({ children, first }) {
  return (
    <div className={cn('flex w-full flex-col', !first && 'border-t border-[#e2e8f0] pt-4')}>
      <p className="text-sm font-semibold text-[#64748b]">{children}</p>
    </div>
  );
}

/** A row of fields laid out with Figma-accurate proportional widths: each
 * child gets its own flex-grow ratio (roughly matching the design's pixel
 * widths) instead of every field in the row being forced equally wide.
 * Stays on one line (shrinking each field proportionally, same as Figma's
 * fixed-width row) rather than wrapping fields onto new lines. */
export function FieldRow({ children, className }) {
  return (
    <div className={cn('flex w-full flex-nowrap gap-3', className)}>{children}</div>
  );
}
