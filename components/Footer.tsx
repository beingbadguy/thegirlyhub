import Link from "next/link";
import React from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaLinkedinIn,
} from "react-icons/fa";
import { Mail, MapPin, Phone } from "lucide-react";

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

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-10 border-b border-pink-300/25 pb-10 sm:grid-cols-2 lg:grid-cols-4">
        {/* About */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">GirlyHub</h2>
          <p className="text-sm leading-6 text-pink-100/75">
            Your go-to store for minimal, high-quality essentials. We bring
            style & simplicity together.
          </p>

          <div className="mt-5 space-y-2.5 text-sm text-pink-100/70">
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              Shahdara, Delhi – 110032
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 flex-shrink-0" />
              +91 96675549765
            </p>
            <p className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
              officialgirlyhub@gmail.com
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="mb-4 text-base font-medium">Quick Links</h3>
          <ul className="space-y-2 text-sm text-pink-100/75">
            <li>
              <Link href="/" className="transition-colors hover:text-pink-200">Home</Link>
            </li>
            <li>
              <Link href="/product" className="transition-colors hover:text-pink-200">Shop</Link>
            </li>
            <li>
              <Link href="/about" className="transition-colors hover:text-pink-200">About Us</Link>
            </li>
            <li>
              <Link href="/contact" className="transition-colors hover:text-pink-200">Contact</Link>
            </li>
            <li>
              <Link href="/track" className="transition-colors hover:text-pink-200">Track Order</Link>
            </li>
          </ul>
        </div>

        {/* Policies */}
        <div>
          <h3 className="mb-4 text-base font-medium">Policies</h3>
          <ul className="space-y-2 text-sm text-pink-100/75">
            <li>
              <Link href="/policies/terms-of-service" className="transition-colors hover:text-pink-200">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/policies/privacy-policy" className="transition-colors hover:text-pink-200">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/policies/refund-policy" className="transition-colors hover:text-pink-200">
                Return & Refund Policy
              </Link>
            </li>
            <li>
              <Link href="/policies/shipping-policy" className="transition-colors hover:text-pink-200">
                Shipping Policy
              </Link>
            </li>
          </ul>
        </div>

        {/* Social */}
        <div>
          <h3 className="mb-4 text-base font-medium">Stay Connected</h3>
          <p className="text-sm leading-6 text-pink-100/70">
            Follow us on social media for latest drops, offers & behind the scenes.
          </p>
          <div className="mt-5 flex gap-3">
            {[
              { icon: FaInstagram, href: "#", label: "Instagram" },
              { icon: FaFacebookF, href: "#", label: "Facebook" },
              { icon: FaTwitter, href: "#", label: "Twitter" },
              { icon: FaLinkedinIn, href: "#", label: "LinkedIn" },
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
        </div>
      </div>

      <div className="relative flex flex-col items-center gap-2 pt-6 text-center text-xs text-pink-100/60">
        <p>© {new Date().getFullYear()} GirlyHub. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
