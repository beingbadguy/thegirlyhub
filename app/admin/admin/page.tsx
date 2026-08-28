"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/store";
import axios, { AxiosError } from "axios";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === "admin") {
      router.replace("/dashboard");
    }
  }, [router, user]);

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post("/api/login", credentials);
      const authenticatedUser = response.data.data;

      if (authenticatedUser.role !== "admin") {
        await axios.post("/api/logout");
        setError("This account does not have administrator access.");
        return;
      }

      setUser(authenticatedUser);
      router.replace("/dashboard");
    } catch (requestError: unknown) {
      if (requestError instanceof AxiosError) {
        setError(requestError.response?.data?.message || "Unable to sign in.");
      } else {
        setError("Unable to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f5f7] px-5 py-8 text-[#17191c] md:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_24px_80px_rgba(23,25,28,0.12)]">
        <section className="hidden w-[45%] flex-col justify-between bg-[#17191c] p-10 text-white md:flex">
          <div>
            <span className="relative block h-12 w-36 overflow-hidden rounded ">
              <Image
                src="/girly3.png"
                alt="GirlyHub"
                width={240}
                height={360}
                className=" h-[151px] w-[80px]"
              />
            </span>
            <div className="mt-24 max-w-sm">
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-[#d9fb71]">
                Operations console
              </p>
              <h1 className="text-4xl font-semibold leading-tight">
                Run every order, product, and customer interaction from one
                place.
              </h1>
              <p className="mt-5 text-sm leading-6 text-white/60">
                A focused workspace for the GirlyHub team. Your store data stays
                behind a verified administrator session.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/50">
            <ShieldCheck className="size-4 text-[#d9fb71]" /> Protected
            administrator access
          </div>
        </section>

        <section className="flex flex-1 items-center justify-center p-7 md:p-14">
          <div className="w-full max-w-md">
            <div className=" md:hidden">
              <span className="">
                <Image
                  src="/girly3_last.png"
                  alt="GirlyHub"
                  width={240}
                  height={200}
                  className=" h-[151px] w-[80px]"
                />
              </span>
            </div>
            <div className="mb-8">
              <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-[#eef7c9] text-[#526500]">
                <LockKeyhole className="size-5" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                Admin sign in
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-black/55">
                Sign in with an administrator account to continue.
              </p>
            </div>

            <form onSubmit={submitLogin} className="space-y-5">
              <label className="block text-sm font-medium">
                Email address
                <Input
                  className="mt-2 h-12 border-black/15 bg-white px-4"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="admin@girlyhub.com"
                  value={credentials.email}
                  onChange={(event) =>
                    setCredentials({
                      ...credentials,
                      email: event.target.value,
                    })
                  }
                  required
                />
              </label>
              <label className="block text-sm font-medium">
                Password
                <div className="relative mt-2">
                  <Input
                    className="h-12 border-black/15 bg-white px-4 pr-12"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={(event) =>
                      setCredentials({
                        ...credentials,
                        password: event.target.value,
                      })
                    }
                    required
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-black/45 hover:text-black"
                  >
                    {showPassword ? (
                      <EyeOff className="size-5" />
                    ) : (
                      <Eye className="size-5" />
                    )}
                  </button>
                </div>
              </label>
              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full justify-between bg-[#17191c] px-5 text-white hover:bg-black"
              >
                {loading ? "Signing in..." : "Enter dashboard"}
                <ArrowRight className="size-4" />
              </Button>
            </form>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-8 text-sm text-black/50 underline-offset-4 hover:text-black hover:underline"
            >
              Return to storefront
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
