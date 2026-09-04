"use client";

import axios, { AxiosError } from "axios";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Loader2, MailCheck } from "lucide-react";

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const next = searchParams.get("next") || "/";
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    document.title = "Verify your email | GirlyHub";
    inputs.current[0]?.focus();
  }, []);

  const updateCode = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const nextCode = [...code];
    nextCode[index] = digit;
    setCode(nextCode);
    setError("");
    if (digit && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const verify = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (code.join("").length !== 6) {
      setError("Enter the six-digit code from your email.");
      return;
    }
    setLoading(true);
    try {
      await axios.post("/api/verify", { token: code.join("") });
      router.replace(next);
    } catch (requestError: unknown) {
      setError(
        requestError instanceof AxiosError
          ? requestError.response?.data?.message ||
              "That code is invalid or expired."
          : "That code is invalid or expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!email) {
      setError(
        "Your email address is missing. Return to sign in and try again.",
      );
      return;
    }
    setResending(true);
    setError("");
    try {
      await axios.post("/api/verification", { email });
      setNotice("A fresh verification code is on its way.");
    } catch (requestError: unknown) {
      setError(
        requestError instanceof AxiosError
          ? requestError.response?.data?.message || "Unable to resend the code."
          : "Unable to resend the code.",
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="flex min-h-[78vh] items-center justify-center bg-[#fcfcfb] px-4 py-12 text-[#111]">
      <section className="w-full max-w-[430px] px-0 py-6">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#f8e8ef] text-[#a71958]">
          <MailCheck className="size-6" />
        </div>
        <div className="mt-7 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#a71958]">
            One last step
          </p>
          <h1 className="mt-3 text-[27px] font-semibold tracking-[-0.03em]">
            Verify your email address
          </h1>
          <p className="mx-auto mt-3 max-w-[300px] text-sm leading-6 text-black/50">
            Enter the six-digit verification code we sent to{" "}
            <strong className="font-semibold text-black/75">
              {email || "your email address"}
            </strong>
            .
          </p>
        </div>

        <form onSubmit={verify} className="mt-8">
          <div className="flex justify-between gap-2">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputs.current[index] = element;
                }}
                value={digit}
                onChange={(event) => updateCode(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                aria-label={`Verification digit ${index + 1}`}
                className="h-12 w-10 rounded-xl border border-black/10 bg-[#fcfcfb] text-center text-lg font-semibold outline-none transition focus:border-[#a71958] focus:ring-4 focus:ring-[#a71958]/10 sm:w-11"
              />
            ))}
          </div>
          {error && (
            <p className="mt-4 text-center text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="mt-4 text-center text-sm text-emerald-700">
              {notice}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <Check className="size-4" /> Confirm email
              </>
            )}
          </button>
        </form>

        <div className="mt-7 text-center text-sm text-black/50">
          <span>Didn&apos;t receive a code? </span>
          <button
            type="button"
            onClick={resend}
            disabled={resending}
            className="font-semibold text-[#a71958] hover:underline disabled:opacity-50"
          >
            {resending ? "Sending..." : "Resend"}
          </button>
        </div>
        <Link
          href={next === "/dashboard" ? "/admin/admin" : "/login"}
          className="mt-6 flex items-center justify-center gap-2 text-xs text-black/40 hover:text-black"
        >
          <ArrowLeft className="size-3" /> Back to sign in
        </Link>
      </section>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<main className="min-h-[78vh] bg-[#fcfcfb]" />}>
      <VerifyForm />
    </Suspense>
  );
}
