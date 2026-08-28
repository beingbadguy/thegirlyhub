"use client";

import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import {
  FaEnvelope,
  FaPaperPlane,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaInstagram,
} from "react-icons/fa";
import { VscLoading } from "react-icons/vsc";

const ContactUs = () => {
  const router = useRouter();

  const [data, setData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

    if (data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (data.phone.trim() && !/^\+?[0-9\s\-()]{8,16}$/.test(data.phone.trim())) {
      setError("Please enter a valid phone number.");
      return;
    }

    setLoading(true);

    try {
      await axios.post("/api/contact", data);

      setSuccess("Message sent successfully 💌");
      setData({
        name: "",
        email: "",
        phone: "",
        message: "",
      });
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
    <div className="min-h-screen  px-4 py-10">
      {/* Breadcrumb */}
      <div className=" mx-auto text-sm text-gray-500 mb-6">
        <span
          className="cursor-pointer hover:text-pink-600 transition"
          onClick={() => router.push("/")}
        >
          Home
        </span>{" "}
        / <span className="text-gray-800">Contact</span>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">

        {/* LEFT SIDE */}
        <div className="flex flex-col justify-center space-y-6">
          <div>
            <h2 className="text-4xl font-semibold text-pink-600 mb-4 tracking-tight">
              Let’s Connect 💌
            </h2>
            <p className="text-gray-600 text-base leading-relaxed">
              We’re here to help you with anything. Reach out and we’ll respond as soon as possible.
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
                href="tel:+9196675549765"
                className="hover:text-pink-600 transition"
              >
                +91 96675 549765
              </a>
            </div>

            {/* Location */}
            <div className="flex items-center gap-3">
              <FaMapMarkerAlt className="text-pink-500 text-base" />
              <span className="text-gray-600">
                Shahdara, Delhi, India-110032
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
        <div className="bg-white  rounded-3xl p-8">
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

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 rounded-full font-medium transition-all duration-200 hover:opacity-90"
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

            {/* FIXED HEIGHT MESSAGE AREA (NO LAYOUT SHIFT) */}
            <div className="h-5 text-center">
              {error && <p className="text-red-500 text-sm">{error}</p>}
              {success && <p className="text-green-500 text-sm">{success}</p>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;