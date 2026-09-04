export default function SiteLoading() {
  return (
    <main
      aria-label="Loading page"
      className="min-h-[70vh] animate-pulse bg-[#fffafc] px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 h-4 w-40 rounded-full bg-rose-100" />
        <div className="mb-8 h-10 w-56 rounded-lg bg-rose-100" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <div className="aspect-square rounded-2xl bg-rose-100" />
              <div className="h-4 w-4/5 rounded-full bg-rose-100" />
              <div className="h-4 w-2/5 rounded-full bg-rose-50" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
