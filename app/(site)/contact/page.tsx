"use client";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import {
  FaEnvelope,
  FaPaperPlane,
  FaPhoneAlt,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { VscLoading } from "react-icons/vsc";

const ContactUs = () => {
  const router = useRouter();
  const [data, setData] = useState({
    name: "",
    email: "",
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

    if (!data.name || !data.email || !data.message) {
      setError("Please fill all the fields.");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/contact", data);
      // console.log(response.data);
      setSuccess("Your message has been sent!");
      setData({
        name: "",
        email: "",
        message: "",
      });
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error(error.response?.data);
      } else {
        console.error(error);
        setError("Something went wrong. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 min-h-[60vh]">
      <div className="text-sm  text-gray-500 mb-4">
        <span
          className="cursor-pointer hover:text-pink-600"
          onClick={() => router.push("/")}
        >
          Home
        </span>{" "}
        / <span className="cursor-pointer text-black">Contact Us</span>{" "}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10  md:px-12 lg:px-24 ">
        {/* Left: Contact Info */}
        <div className="flex flex-col justify-center space-y-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-pink-700 mb-4">
              Get In Touch
            </h2>
            <p className="text-gray-600 text-base md:text-lg">
              Have questions, feedback, or need support? We’d love to hear from
              you. Fill out the form or reach out directly.
            </p>
          </div>

          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-center gap-3">
              <FaEnvelope className="text-black" />
              <span>authorisedaman@gmail.com</span>
            </div>
            <div className="flex items-center gap-3">
              <FaPhoneAlt className="text-black" />
              <span>+91 96675 XXXX</span>
            </div>
            <div className="flex items-center gap-3">
              <FaMapMarkerAlt className="text-black" />
              <span>New Delhi, Delhi, India - 110001</span>
            </div>
          </div>
        </div>

        {/* Right: Contact Form */}
        <form className="space-y-5 w-full" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            value={data.name}
            onChange={handleChange}
            placeholder="Your Name"
            className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
          />

          <input
            type="email"
            name="email"
            value={data.email}
            onChange={handleChange}
            placeholder="Your Email"
            className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
          />

          <textarea
            name="message"
            rows={5}
            value={data.message}
            onChange={handleChange}
            placeholder="Your Message"
            className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
          />

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-black hover:bg-black/80 text-white text-sm font-medium px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
          >
            {loading ? (
              <VscLoading className="animate-spin " />
            ) : (
              <div className="flex items-center justify-center gap-2">
                <FaPaperPlane className="w-4 h-4" />
                Send Message
              </div>
            )}
          </button>

          {error && <p className="text-red-600 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}
        </form>
      </div>
    </div>
  );
};

export default ContactUs;
