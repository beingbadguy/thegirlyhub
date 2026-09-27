"use client";

export default function ProfileSkeleton() {
  return (
    <div className="bg-[#fdf7f9] min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6 animate-pulse">
        {/* Hero Banner Skeleton */}
        <div className="h-44 rounded-3xl bg-white/80 border border-rose-100/70 p-6 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="size-24 rounded-full bg-rose-100" />
            <div className="space-y-2">
              <div className="h-6 w-48 rounded-lg bg-rose-200/80" />
              <div className="h-4 w-36 rounded-md bg-stone-200" />
              <div className="h-3 w-28 rounded-md bg-rose-100" />
            </div>
          </div>
          <div className="hidden sm:block h-10 w-28 rounded-xl bg-rose-100" />
        </div>

        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-white/80 border border-rose-100/70 p-4 space-y-2"
            >
              <div className="size-8 rounded-lg bg-rose-100" />
              <div className="h-6 w-16 rounded-md bg-rose-200/70" />
              <div className="h-3 w-20 rounded-md bg-stone-200" />
            </div>
          ))}
        </div>

        {/* Content Layout Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-64 rounded-2xl bg-white/80 border border-rose-100/70 p-4 space-y-2 hidden md:block">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 rounded-xl bg-stone-100" />
            ))}
          </div>
          <div className="md:col-span-3 h-96 rounded-3xl bg-white/80 border border-rose-100/70 p-6" />
        </div>
      </div>
    </div>
  );
}
