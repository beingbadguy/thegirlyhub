import Link from "next/link";
import React from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaLinkedinIn,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="relative mt-16 overflow-visible bg-pink-950 px-6 pb-8 pt-16 text-white md:px-20">
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
        <img
          src="/bow.png"
          alt="Decorative bow"
          className="h-20 w-auto object-contain drop-shadow-md sm:h-24"
        />
      </div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-10 border-b border-pink-300/25 pb-10 md:grid-cols-4">
        {/* About */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">GirlyHub</h2>
          <p className="text-sm leading-6 text-pink-100/75">
            Your go-to store for minimal, high-quality essentials. We bring
            style & simplicity together.
          </p>
        </div>

        {/* Links */}
        <div>
          <h3 className="mb-4 text-base font-medium">Company</h3>
          <ul className="space-y-2 text-sm text-pink-100/75">
            <li>
              <Link href="/about">About Us</Link>
            </li>
            <li>
              <Link href="/careers">Careers</Link>
            </li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="mb-4 text-base font-medium">Support</h3>
          <ul className="space-y-2 text-sm text-pink-100/75">
            <li>
              <Link href="/contact">Help Center</Link>
            </li>
            <li>
              <Link href="/contact">Returns</Link>
            </li>
            <li>
              <Link href="/track">Track Order</Link>
            </li>
          </ul>
        </div>

        {/* Newsletter + Social */}
        <div>
          <h3 className="mb-4 text-base font-medium">Stay in the loop</h3>
          <div className="mt-6 flex gap-4 text-white">
            <FaFacebookF className="cursor-pointer hover:text-pink-200" />
            <FaInstagram className="cursor-pointer hover:text-pink-200" />
            <FaTwitter className="cursor-pointer hover:text-pink-200" />
            <FaLinkedinIn className="cursor-pointer hover:text-pink-200" />
          </div>
        </div>
      </div>

      <div className="relative pt-6 text-center text-sm text-pink-100/80">
        © {new Date().getFullYear()} GirlyHub. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
