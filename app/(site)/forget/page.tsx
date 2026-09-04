"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios, { AxiosError } from "axios";
import Link from "next/link";
import { useState, useEffect } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgetPage() {
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Forgot Password | GirlyHub";
  }, []);

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!userEmail) {
      setError("Please enter your email address.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(userEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/api/forget", { email: userEmail });
      setSuccess(
        response?.data?.message ||
          "Reset instructions have been sent to your email.",
      );
      setUserEmail("");
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error(error?.response?.data);
        setError(
          error.response?.data?.message ||
            "We couldn't process that request. Please try again.",
        );
      } else {
        console.error("An error occurred:", error);
        setError("Something went wrong. Please try again in a moment.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] bg-[#FAF9F9] w-full flex flex-col py-6">
      {/* Breadcrumbs */}
      <div className="w-full  mx-auto px-4 md:px-8 pb-2 text-left">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-neutral-400">
          <Link
            href="/"
            className="cursor-pointer transition-colors hover:text-neutral-800"
          >
            Home
          </Link>
          <span>/</span>
          <span className="text-neutral-800 font-bold">Forgot Password</span>
        </div>
      </div>

      {/* Main content centered */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="p-0 md:p-2">
            {/* Icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 mb-6">
              <Mail className="w-5 h-5 text-rose-500" />
            </div>

            {/* Heading */}
            <h1 className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight mb-2">
              Forgot your password?
            </h1>
            <p className="text-sm text-neutral-500 leading-relaxed mb-7">
              No worries, it happens. Enter the email address linked to your
              account and we&apos;ll send you a link to reset your password.
            </p>

            {/* Success state */}
            {success ? (
              <div className="space-y-6">
                <div className="flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 p-4">
                  <CheckCircle2 className="w-4.5 h-4.5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-700">
                      Check your inbox
                    </p>
                    <p className="text-xs text-green-600 mt-1 leading-relaxed">
                      {success}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Didn&apos;t get an email? Check your spam folder, or{" "}
                  <button
                    onClick={() => setSuccess(null)}
                    className="text-rose-500 font-semibold hover:text-rose-600 underline underline-offset-2"
                  >
                    try a different address
                  </button>
                  .
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="text-xs font-semibold text-neutral-700"
                  >
                    Email address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="border border-neutral-200 focus:border-rose-400 p-2.5 focus:ring-2 focus:ring-rose-100 outline-none transition-all rounded-xl"
                    value={userEmail}
                    onChange={(e) => {
                      setUserEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSubmit(
                          e as unknown as React.MouseEvent<HTMLButtonElement>,
                        );
                      }
                    }}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-100 px-3 py-2.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <p className="text-rose-600 text-xs font-semibold">
                      {error}
                    </p>
                  </div>
                )}

                <Button
                  disabled={loading}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white cursor-pointer transition-colors rounded-xl py-2.5 font-semibold text-sm disabled:opacity-60"
                  onClick={handleSubmit}
                >
                  {loading ? (
                    <AiOutlineLoading3Quarters className="animate-spin text-white" />
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </div>
            )}

            {/* Back to login */}
            <div className="mt-7 pt-6 border-t border-neutral-100 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-800 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to login
              </Link>
            </div>
          </div>

          {/* Support note */}
          <p className="text-center text-xs text-neutral-400 mt-6">
            Still having trouble? Reach out to{" "}
            <a
              href="mailto:support@girlyhub.com"
              className="font-semibold text-neutral-600 hover:text-rose-500 transition-colors"
            >
              officialgirlyhub@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
