"use client";

import axios, { AxiosError } from "axios";
import React, { useEffect, useState } from "react";
import BreadcrumbHome from "@/components/BreadcrumbHome";
import CaptchaWidget from "@/components/CaptchaWidget";
import { executeCaptcha, loadCaptchaScript } from "@/lib/clientCaptcha";
import {
  FaEnvelope,
  FaPaperPlane,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaInstagram,
} from "react-icons/fa";
import { VscLoading } from "react-icons/vsc";
import { ShieldCheck } from "lucide-react";
import FloralAccent from "@/components/decorations/FloralAccent";

export default function ContactClient() {
  const [data, setData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCaptchaScript().catch(() => {});
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!data.name.trim() || !data.message.trim()) {
      setError("Please enter your name and message.");
      return;
    }

    if (!data.email.trim() && !data.phone.trim()) {
      setError("Please provide either an email address or a phone number.");
      return;
    }

    if (
      data.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())
    ) {
      setError("Please enter a valid email address.");
      return;
    }

    if (
      data.phone.trim() &&
      !/^\+?[0-9\s\-()]{8,16}$/.test(data.phone.trim())
    ) {
      setError("Please enter a valid phone number.");
      return;
    }

    setLoading(true);

    try {
      const finalToken = captchaToken || (await executeCaptcha("contact_form"));
      await axios.post("/api/contact", {
        ...data,
        captchaToken: finalToken,
      });

      setSuccess("Message sent successfully 💌");
      setData({
        name: "",
        email: "",
        phone: "",
        message: "",
      });
      setCaptchaToken("");
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setError(error.response?.data?.message || "Failed to send message.");
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffafb] relative overflow-hidden py-6 sm:py-10">
      {/* Background floral flourishes */}
      <div className="pointer-events-none absolute right-[-30px] top-24 hidden opacity-25 lg:block select-none">
        <FloralAccent flower={1} size="xl" animation="float" />
      </div>
      <div className="pointer-events-none absolute left-[-25px] bottom-20 hidden opacity-20 lg:block select-none">
        <FloralAccent flower={2} size="lg" animation="sway" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex items-center gap-2 text-xs md:text-sm text-neutral-500"
        >
          <BreadcrumbHome />
          <span className="text-neutral-300">/</span>
          <span className="font-semibold text-neutral-900 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/50">
            Contact
          </span>
        </nav>

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-200/80 bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#8a3348] shadow-2xs backdrop-blur-xs mb-3">
            <span>We&apos;d Love To Hear From You</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal text-[#4e1a27] font-cormorant tracking-[0.01em] leading-tight">
            Let&apos;s Connect &amp; Say Hello 💌
          </h1>

          <p className="mt-3 font-cormorant italic text-lg sm:text-xl text-[#874b5c] font-light">
            &ldquo;We&apos;re here for styling advice, order tracking, and all things pretty.&rdquo;
          </p>
        </div>

        <div className="mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* LEFT SIDE: Contact Channels */}
          <div className="lg:col-span-5 space-y-4">
            {/* Direct Cards */}
            <a
              href="https://wa.me/918368422490"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-4 p-5 rounded-3xl bg-white border border-rose-100 shadow-xs hover:shadow-md hover:border-rose-300 transition-all duration-300"
            >
              <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FaPhoneAlt className="size-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Fastest Reply
                </span>
                <h3 className="text-sm font-semibold text-[#4e1a27] mt-1">
                  WhatsApp Support
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">+91 836 842 2490</p>
                <p className="text-[11px] text-[#8a6b70] mt-1">Chat directly with our styling team</p>
              </div>
            </a>

            <a
              href="mailto:officialgirlyhub@gmail.com"
              className="group flex items-start gap-4 p-5 rounded-3xl bg-white border border-rose-100 shadow-xs hover:shadow-md hover:border-rose-300 transition-all duration-300"
            >
              <div className="size-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FaEnvelope className="size-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                  Official Inquiries
                </span>
                <h3 className="text-sm font-semibold text-[#4e1a27] mt-1">
                  Email Support
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">officialgirlyhub@gmail.com</p>
                {/* <p className="text-[11px] text-[#8a6b70] mt-1">Order questions, returns &amp; collaborations</p> */}
                <p className="text-[11px] text-[#8a6b70] mt-1">Order questions, replacements &amp; collaborations</p>
              </div>
            </a>

            <a
              href="https://instagram.com/officialgirlyhub"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-4 p-5 rounded-3xl bg-white border border-rose-100 shadow-xs hover:shadow-md hover:border-rose-300 transition-all duration-300"
            >
              <div className="size-12 rounded-2xl bg-pink-50 text-pink-600 border border-pink-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FaInstagram className="size-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">
                  Community Hub
                </span>
                <h3 className="text-sm font-semibold text-[#4e1a27] mt-1">
                  Instagram DMs
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">@officialgirlyhub</p>
                <p className="text-[11px] text-[#8a6b70] mt-1">Join 25K+ girls for styling tips &amp; drops</p>
              </div>
            </a>

            {/* Studio Address */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-[#fcf7f4] to-[#fdfbf7] border border-[#eadfd5] text-xs text-gray-600">
              <div className="flex items-center gap-2 text-[#4e1a27] font-semibold text-sm mb-1">
                <FaMapMarkerAlt className="text-rose-500" />
                <span>GirlyHub Studio</span>
              </div>
              <p className="mt-1 leading-relaxed text-[#8a6b70]">
                Shahdara, New Delhi, India - 110032
              </p>
              <div className="mt-2.5 pt-2.5 border-t border-[#eadfd5]/70 flex items-center gap-2 text-[#4e1a27]">
                <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] text-gray-700">
                  Govt. MSME Reg: <strong className="font-mono text-[#4e1a27] font-semibold">UDYAM-DL-07-0026329</strong>
                </span>
              </div>
              <p className="mt-2 text-[11px] text-gray-400">
                Operating Hours: Monday – Saturday (10:00 AM – 7:00 PM IST)
              </p>
            </div>
          </div>

          {/* RIGHT SIDE: Elevated Form */}
          <div className="lg:col-span-7 relative overflow-hidden bg-white/85 backdrop-blur-xs rounded-3xl sm:rounded-4xl p-6 sm:p-10 shadow-xs border border-rose-100/90">
            <div className="pointer-events-none absolute right-3 top-3 opacity-20 select-none hidden sm:block">
              <FloralAccent flower={1} size="md" animation="pulse" />
            </div>

            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-[#4e1a27] font-cormorant">
                Send Us a Note
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 font-sans">
                Fill out the quick form below and we&apos;ll get back to you within 24 hours.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4e1a27] mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={data.name}
                    onChange={handleChange}
                    placeholder="e.g. Ananya Sharma"
                    className="w-full px-4 py-3 rounded-2xl border border-rose-200/80 bg-rose-50/30 text-xs sm:text-sm text-[#4e1a27] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-300 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4e1a27] mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={data.email}
                    onChange={handleChange}
                    placeholder="yourname@gmail.com"
                    className="w-full px-4 py-3 rounded-2xl border border-rose-200/80 bg-rose-50/30 text-xs sm:text-sm text-[#4e1a27] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-300 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4e1a27] mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={data.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 rounded-2xl border border-rose-200/80 bg-rose-50/30 text-xs sm:text-sm text-[#4e1a27] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-300 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4e1a27] mb-1.5">
                  Your Message *
                </label>
                <textarea
                  name="message"
                  rows={4}
                  value={data.message}
                  onChange={handleChange}
                  placeholder="How can we help make your day a little more sparkly?"
                  className="w-full px-4 py-3 rounded-2xl border border-rose-200/80 bg-rose-50/30 text-xs sm:text-sm text-[#4e1a27] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-300 transition"
                />
              </div>

              {/* CAPTCHA WIDGET */}
              <CaptchaWidget
                onVerify={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken("")}
              />

              {/* BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#6e1e32] via-[#8a2a44] to-[#5a1427] text-white py-3.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide shadow-md hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {loading ? (
                    <>
                      <VscLoading className="animate-spin" />
                      Sending Note...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="size-3.5" />
                      Send Note With Love 💌
                    </>
                  )}
                </span>
              </button>

              <div className="min-h-5 text-center">
                {error && <p className="text-red-500 text-xs">{error}</p>}
                {success && <p className="text-emerald-600 text-xs font-medium">{success}</p>}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
