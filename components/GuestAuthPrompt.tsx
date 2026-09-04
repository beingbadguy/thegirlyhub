"use client";

import { LogIn } from "lucide-react";
import Link from "next/link";

type GuestAuthPromptProps = {
  title: string;
  description: string;
};

export default function GuestAuthPrompt({
  title,
  description,
}: GuestAuthPromptProps) {
  return (
    <main className="flex min-h-[72vh] items-center justify-center bg-[#fffafc] px-5 py-12 text-center">
      <section className="flex w-full max-w-md flex-col items-center">
        <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <LogIn className="size-7" strokeWidth={1.7} />
        </div>
        {/* <p className="font-instrument text-lg text-rose-600">A little pause</p> */}
        <h1 className="mt-2 font-sans text-3xl font-semibold tracking-tight text-rose-950">
          {title}
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-neutral-500">
          {description}
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-rose-600 px-8 text-sm font-semibold text-white transition hover:bg-rose-700"
        >
          Login to continue
        </Link>
        <p className="mt-4 text-xs text-neutral-400">
          New to GirlyHub?{" "}
          <Link href="/signup" className="text-rose-600 hover:underline">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
