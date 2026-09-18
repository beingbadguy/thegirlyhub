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
    <div className="min-h-screen bg-[#fffafb] relative overflow-hidden">
      {/* Background floral flourishes */}
      <div className="pointer-events-none absolute right-[-40px] top-20 hidden opacity-20 lg:block select-none">
        <FloralAccent flower={1} size="xl" animation="float" />
      </div>
      <div className="pointer-events-none absolute left-[-30px] bottom-10 hidden opacity-20 lg:block select-none">
        <FloralAccent flower={2} size="lg" animation="sway" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 relative z-10">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-2 text-xs md:text-sm text-neutral-500"
        >
          <BreadcrumbHome />
          <span className="text-neutral-300">/</span>
          <span className="font-semibold text-neutral-900">Contact</span>
        </nav>

        <div className="mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* LEFT SIDE */}
        <div className="flex flex-col justify-center space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FloralAccent flower={1} size="sm" animation="pulse" />
              <h1 className="text-3xl md:text-4xl font-semibold text-pink-600 tracking-tight font-serif">
                Let’s Connect 💌
              </h1>
            </div>
            <p className="text-gray-600 text-base leading-relaxed">
              We’re here to help you with your orders, questions, and styling advice. Reach out and our team will get back to you promptly!
            </p>
          </div>

          <div className="space-y-4 text-gray-700 text-sm">
            {/* Email */}
            <div className="flex items-center gap-3">
              <FaEnvelope className="text-pink-500 text-base" />
              <a
                href="mailto:officialgirlyhub@gmail.com"
                className="hover:text-pink-600 transition"
              >
                officialgirlyhub@gmail.com
              </a>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-3">
              <FaPhoneAlt className="text-pink-500 text-base" />
              <a
                href="tel:+918368422490"
                className="hover:text-pink-600 transition"
              >
                +91 836 842 2490
              </a>
            </div>

            {/* Location */}
            <div className="flex items-center gap-3">
              <FaMapMarkerAlt className="text-pink-500 text-base" />
              <span className="text-gray-600">
                Shahdara, Delhi, India - 110032
              </span>
            </div>

            {/* Instagram */}
            <div className="flex items-center gap-3">
              <FaInstagram className="text-pink-500 text-base" />
              <a
                href="https://instagram.com/officialgirlyhub"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-pink-600 transition"
              >
                @officialgirlyhub
              </a>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE FORM */}
        <div className="relative overflow-hidden bg-white rounded-3xl p-8 shadow-sm border border-rose-100">
          <div className="pointer-events-none absolute right-3 top-3 opacity-15 select-none hidden sm:block">
            <FloralAccent flower={1} size="md" animation="pulse" />
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="text"
              name="name"
              value={data.name}
              onChange={handleChange}
              placeholder="Your Name"
              className="w-full px-4 py-3 rounded-xl border border-pink-200 bg-pink-50 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
            />

            <input
              type="email"
              name="email"
              value={data.email}
              onChange={handleChange}
              placeholder="Email"
              className="w-full px-4 py-3 rounded-xl border border-pink-200 bg-pink-50 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
            />

            <input
              type="tel"
              name="phone"
              value={data.phone}
              onChange={handleChange}
              placeholder="Phone"
              className="w-full px-4 py-3 rounded-xl border border-pink-200 bg-pink-50 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
            />

            <textarea
              name="message"
              rows={5}
              value={data.message}
              onChange={handleChange}
              placeholder="Write your message..."
              className="w-full px-4 py-3 rounded-xl border border-pink-200 bg-pink-50 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
            />

            {/* CAPTCHA WIDGET */}
            <CaptchaWidget
              onVerify={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken("")}
            />

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 rounded-full font-medium transition-all duration-200 hover:opacity-90 cursor-pointer shadow-md shadow-pink-200"
            >
              <span className="flex items-center gap-2">
                {loading ? (
                  <>
                    <VscLoading className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <FaPaperPlane />
                    Send Message
                  </>
                )}
              </span>
            </button>

            <div className="h-5 text-center">
              {error && <p className="text-red-500 text-sm">{error}</p>}
              {success && <p className="text-green-500 text-sm">{success}</p>}
            </div>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}
