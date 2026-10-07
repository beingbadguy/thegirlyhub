"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useState } from "react";
import { FaInstagram } from "react-icons/fa";
import { SiGooglepay, SiPaytm } from "react-icons/si";
import {
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  Award,
  Lock,
  Truck,
} from "lucide-react";
import LogoMark from "@/components/LogoMark";

const Footer = () => {
  const [copied, setCopied] = useState(false);
  const udyamNumber = "UDYAM-DL-07-0026329";

  const handleCopyUdyam = () => {
    navigator.clipboard.writeText(udyamNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <footer className="relative mt-16 overflow-visible bg-pink-950 px-6 pb-28 pt-16 text-white md:px-20 md:pb-8">
      {/* Top decorative cut + bow */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-10 h-16"
        aria-hidden="true"
      >
        <div className="absolute inset-y-0 left-0 w-1/2 rounded-tr-[70px] bg-pink-950" />
        <div className="absolute inset-y-0 right-0 w-1/2 rounded-tl-[70px] bg-pink-950" />
      </div>

      {/* Bow – centered on the top edge */}
      <div className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2">
        <Image
          src="/bow.png"
          alt="Decorative bow"
          width={96}
          height={96}
          className="h-20 w-auto object-contain drop-shadow-md sm:h-24"
        />
      </div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-8 border-b border-pink-300/25 pb-10 sm:grid-cols-2 lg:grid-cols-5">
        {/* About */}
        <div className="lg:col-span-1">
          <div className="mb-4">
            <LogoMark isFooter={true} className="h-10" />
          </div>
          <p className="text-sm leading-6 text-pink-100/75">
            GirlyHub is your premier online destination for aesthetic jewellery,
            Korean hair claws, satin scrunchies, earrings, and cute daily essentials.
          </p>

          <div className="mt-5 space-y-2.5 text-xs text-pink-100/70">
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-pink-300" />
              Shahdara, Delhi – 110032
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 flex-shrink-0 text-pink-300" />
              +91 836 842 2490
            </p>
            <p className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 flex-shrink-0 text-pink-300" />
              officialgirlyhub@gmail.com
            </p>
          </div>

          {/* Quick MSME verification tag */}
          <div className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-950/35 p-2.5 backdrop-blur-xs">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/90">
                  Govt. Registered MSME
                </p>
                <p className="font-mono text-xs font-bold tracking-wider text-white">
                  {udyamNumber}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-pink-200">Shop & Explore</h3>
          <ul className="space-y-2.5 text-sm text-pink-100/75">
            <li>
              <Link href="/" className="transition-colors hover:text-pink-200">
                Home
              </Link>
            </li>
            <li>
              <Link href="/product" className="transition-colors hover:text-pink-200">
                Shop All Products
              </Link>
            </li>
            <li>
              <Link href="/categories" className="transition-colors hover:text-pink-200">
                All Categories
              </Link>
            </li>
            <li>
              <Link href="/newarrivals" className="transition-colors hover:text-pink-200">
                New Arrivals
              </Link>
            </li>
            <li>
              <Link href="/track" className="transition-colors hover:text-pink-200">
                Track Order
              </Link>
            </li>
          </ul>
        </div>

        {/* Top Collections */}
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-pink-200">Top Collections</h3>
          <ul className="space-y-2.5 text-sm text-pink-100/75">
            <li>
              <Link href="/category/Korean%20Claws" className="transition-colors hover:text-pink-200">
                Korean Hair Claws
              </Link>
            </li>
            <li>
              <Link href="/category/Jewellery" className="transition-colors hover:text-pink-200">
                Dainty Jewellery
              </Link>
            </li>
            <li>
              <Link href="/category/Earrings" className="transition-colors hover:text-pink-200">
                Aesthetic Earrings
              </Link>
            </li>
            <li>
              <Link href="/category/Scrunchies" className="transition-colors hover:text-pink-200">
                Satin Scrunchies
              </Link>
            </li>
            <li>
              <Link href="/category/Hair%20Accessories" className="transition-colors hover:text-pink-200">
                Hair Accessories
              </Link>
            </li>
          </ul>
        </div>

        {/* Customer Care & Policies */}
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-pink-200">Customer Care</h3>
          <ul className="space-y-2.5 text-sm text-pink-100/75">
            <li>
              <Link href="/about" className="transition-colors hover:text-pink-200">
                About GirlyHub
              </Link>
            </li>
            <li>
              <Link href="/contact" className="transition-colors hover:text-pink-200">
                Contact & Support
              </Link>
            </li>
            <li>
              <Link href="/policies/shipping-policy" className="transition-colors hover:text-pink-200">
                Shipping Policy
              </Link>
            </li>
            <li>
              <Link href="/policies/refund-policy" className="transition-colors hover:text-pink-200">
                Replacement Policy
              </Link>
            </li>
            <li>
              <Link href="/policies/privacy-policy" className="transition-colors hover:text-pink-200">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/policies/terms-of-service" className="transition-colors hover:text-pink-200">
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>

        {/* Social & Connect */}
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-pink-200">Stay Connected</h3>
          <p className="text-sm leading-6 text-pink-100/70">
            Join 25,000+ girls on Instagram for daily styling inspiration, fresh drops, and giveaways.
          </p>
          <div className="mt-5 flex gap-3">
            {[
              {
                icon: FaInstagram,
                href: "https://www.instagram.com/officialgirlyhub",
                label: "Instagram",
              },
            ].map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-900/50 text-pink-100 transition-all hover:bg-pink-200 hover:text-pink-950 hover:scale-110"
              >
                <Icon className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
          <div className="mt-6 rounded-2xl bg-pink-900/40 border border-pink-700/30 p-3.5 text-xs text-pink-100/75 space-y-1">
            <p className="font-semibold text-pink-100">✨ Express Pan-India Delivery</p>
            <p className="text-[11px] text-pink-200/60">Dispatched within 24-48 hours with real-time tracking updates.</p>
          </div>
        </div>
      </div>

      {/* Official Government Registration & Customer Trust Assurance Strip */}
      <div className="relative mx-auto mt-10 max-w-7xl">
        <div className="relative overflow-hidden rounded-2xl border border-pink-400/25 bg-gradient-to-r from-pink-900/50 via-pink-950/80 to-pink-900/50 p-5 md:p-6 backdrop-blur-sm shadow-xl">
          {/* Subtle background glow */}
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-rose-500/10 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -left-16 -bottom-16 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative flex flex-col items-center justify-between gap-6 lg:flex-row">
            {/* Left: Official Government of India MSME Recognition */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start lg:items-center gap-4 text-center sm:text-left w-full lg:w-auto">
              {/* Emblem / Badge Icon */}
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/20 via-pink-600/15 to-purple-900/30 text-amber-300 shadow-md">
                <ShieldCheck className="h-7 w-7 text-amber-300" />
                <span className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white ring-2 ring-pink-950">
                  ✓
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/35 bg-amber-400/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Govt. of India Recognized
                  </span>
                  <span className="text-[11px] font-medium text-pink-200/80">
                    Ministry of MSME • Micro Enterprise
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                  <span className="text-xs text-pink-200/90 font-medium">
                    Udyam Reg. No:
                  </span>
                  <span className="rounded-lg border border-pink-400/35 bg-pink-900/85 px-3 py-1 font-mono text-xs sm:text-sm font-bold tracking-widest text-pink-50 shadow-inner select-all">
                    {udyamNumber}
                  </span>

                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={handleCopyUdyam}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-pink-400/30 bg-pink-850 px-2.5 py-1 text-xs font-medium text-pink-100 transition-all hover:bg-pink-800 hover:text-white active:scale-95 cursor-pointer"
                    title="Copy Udyam Registration Number"
                    aria-label="Copy Udyam registration number"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-300 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-pink-300" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  {/* External verification link */}
                  <a
                    href="https://udyamregistration.gov.in/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-pink-400/20 bg-pink-900/40 px-2.5 py-1 text-xs text-pink-200/80 transition-all hover:text-pink-100 hover:border-pink-300/40"
                    title="Verify on official Government Udyam portal"
                  >
                    <span>Verify Portal</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <p className="text-[11px] text-pink-200/65 text-center sm:text-left">
                  GirlyHub is a verified enterprise officially registered with the Ministry of Micro, Small and Medium Enterprises.
                </p>
              </div>
            </div>

            {/* Right: Consumer Trust Badges */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 w-full lg:w-auto pt-4 lg:pt-0 border-t border-pink-400/20 lg:border-t-0">
              <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-pink-900/30 border border-pink-400/15">
                <Award className="h-5 w-5 text-amber-300 mb-1" />
                <span className="text-[11px] font-semibold text-pink-100">100% Genuine</span>
                <span className="text-[10px] text-pink-200/60">Registered Entity</span>
              </div>
              <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-pink-900/30 border border-pink-400/15">
                <Lock className="h-5 w-5 text-emerald-300 mb-1" />
                <span className="text-[11px] font-semibold text-pink-100">Safe Payments</span>
                <span className="text-[10px] text-pink-200/60">SSL 256-Bit Secure</span>
              </div>
              <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-pink-900/30 border border-pink-400/15">
                <Truck className="h-5 w-5 text-pink-300 mb-1" />
                <span className="text-[11px] font-semibold text-pink-100">Pan-India</span>
                <span className="text-[10px] text-pink-200/60">Tracked Express</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 100% Secure Checkout Payment Badges */}
      <div className="relative mx-auto mt-8 flex flex-col items-center justify-center gap-2.5 text-center">
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-pink-200/80">
          100% Secure Checkout
        </span>
        <div className="inline-flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-white px-5 py-2 shadow-md">
          {/* Mastercard SVG */}
          <svg
            className="h-4.5 w-auto"
            viewBox="0 0 24 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Mastercard"
          >
            <circle cx="7.5" cy="9" r="6" fill="#F97316" />
            <circle cx="16.5" cy="9" r="6" fill="#EF4444" />
          </svg>
          <span className="text-[9px] font-extrabold text-neutral-800 border border-neutral-300 px-1.5 py-0.5 tracking-wider">
            RUPAY
          </span>
          <span
            aria-label="Google Pay"
            title="Google Pay"
            className="inline-flex items-center justify-center border border-neutral-300 p-1 text-neutral-800"
          >
            <SiGooglepay className="h-3.5 w-7" aria-hidden="true" />
          </span>
          <span
            aria-label="Paytm"
            title="Paytm"
            className="inline-flex items-center justify-center border border-[#b7d7ff] p-1 text-[#007bff]"
          >
            <SiPaytm className="h-3.5 w-8" aria-hidden="true" />
          </span>
        </div>
      </div>

      <div className="relative flex flex-col items-center gap-2 pt-8 text-center text-xs text-pink-100/60">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <p>© {new Date().getFullYear()} GirlyHub. All rights reserved.</p>
          <span className="hidden sm:inline text-pink-300/30">•</span>
          <p className="font-medium text-pink-100/80">
            MSME Reg. No:{" "}
            <span className="font-mono text-pink-200 font-semibold tracking-wider">
              {udyamNumber}
            </span>
          </p>
        </div>
        <p className="text-[11px] text-pink-200/40">
          Govt. of India Recognized Micro Enterprise • Handcrafted with love in Delhi, India 💖
        </p>
      </div>
    </footer>
  );
};

export default Footer;

