/** Shimmer skeleton shown for a beat right after logging in, while the real
 * Today's Patient header/summary cards/table fade in behind it — matches
 * the page's real layout in rough shape (not pixel-exact) purely so the
 * loading state doesn't feel like a blank flash. */
export default function TodaysPatientSkeleton() {
  return (
    <div className="flex min-h-screen w-full bg-[#f5f6f8]">
      <div className="hidden w-[60px] shrink-0 border-r border-slate-200 bg-white lg:block" />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-[50px] w-full shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex items-center gap-3">
            <div className="shimmer h-5 w-40 rounded-md" />
          </div>
          <div className="flex items-center gap-3">
            <div className="shimmer size-8 rounded-full" />
            <div className="shimmer size-8 rounded-full" />
            <div className="shimmer h-8 w-28 rounded-full" />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="flex gap-4">
            <div className="shimmer h-16 flex-1 rounded-xl" />
            <div className="shimmer h-16 flex-1 rounded-xl" />
            <div className="shimmer h-16 flex-1 rounded-xl" />
          </div>

          <div className="flex items-center justify-between">
            <div className="shimmer h-5 w-40 rounded-md" />
            <div className="flex gap-3">
              <div className="shimmer h-9 w-64 rounded-full" />
              <div className="shimmer h-9 w-32 rounded-full" />
              <div className="shimmer h-9 w-28 rounded-full" />
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-xl bg-white p-4">
            <div className="shimmer h-9 w-full rounded-md" />
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="shimmer h-10 w-full rounded-md" style={{ opacity: 1 - i * 0.06 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
