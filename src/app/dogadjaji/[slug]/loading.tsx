export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12 sm:py-20">
      <span className="sr-only" role="status">
        Učitavanje događaja…
      </span>

      <div aria-hidden="true" className="animate-pulse">
        <div className="bg-line h-4 w-32 rounded" />
        <div className="bg-line mt-8 h-6 w-24 rounded-full" />
        <div className="bg-line mt-4 h-9 w-3/4 rounded" />

        <div className="border-line mt-6 space-y-3 border-t pt-6">
          <div className="bg-line h-4 w-2/3 rounded" />
          <div className="bg-line h-4 w-1/2 rounded" />
        </div>
      </div>
    </div>
  );
}
