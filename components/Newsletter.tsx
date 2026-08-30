"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import axios, { AxiosError } from "axios";
import { Loader2, Mail, Heart } from "lucide-react";

const Newsletter = () => {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [isError, setIsError] = useState<boolean>(false);

  const handleNewsletterSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    if (!email) {
      setMessage("Please enter your email address.");
      setIsError(true);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage("Please enter a valid email address.");
      setIsError(true);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/api/newsletter", { email });
      setMessage(response.data.message || "Thank you for subscribing!");
      setIsError(false);
      setEmail("");
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setMessage(error.response?.data?.message || "Something went wrong.");
      } else {
        setMessage("Something went wrong. Please try again.");
      }
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl py-10 md:py-14">
      <div className="relative overflow-hidden rounded-3xl border border-rose-100/70 bg-[#FFF9FA] px-6 py-12 text-center  sm:px-12 md:py-16">
        {/* Soft decorative hearts (optional) */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-rose-100/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-pink-100/40 blur-3xl" />

        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[11px] font-medium tracking-widest text-rose-500 shadow-sm ring-1 ring-rose-100">
          <Heart className="size-3 fill-rose-400 text-rose-400" />
          NEWSLETTER
        </div>

        {/* Heading */}
        <h2 className="font-serif text-3xl font-medium tracking-tight text-rose-950 sm:text-4xl md:text-[2.75rem]">
          Stay in the loop
        </h2>

        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-rose-900/60">
          Be the first to know about new arrivals, exclusive offers, and little
          surprises.
        </p>

        {/* Form */}
        <form
          onSubmit={handleNewsletterSubmit}
          className="mx-auto mt-9 flex max-w-md flex-col gap-3 sm:flex-row sm:items-center"
        >
          <div className="relative flex-1">
            <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-rose-300" />
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-full border-rose-100 bg-white pl-10 pr-4 text-sm text-rose-950 placeholder:text-rose-300 focus-visible:ring-rose-200"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-12 shrink-0 rounded-full bg-rose-600 px-7 text-sm font-medium text-white transition-all hover:bg-rose-700 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Subscribe"
            )}
          </Button>
        </form>

        {/* Message */}
        {message && (
          <p
            className={`mt-4 text-sm ${isError ? "text-rose-600" : "text-emerald-600"
              }`}
          >
            {message}
          </p>
        )}
      </div>
    </section>
  );
};

export default Newsletter;
