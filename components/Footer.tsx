import Link from "next/link";
import Image from "next/image";
import React from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaLinkedinIn,
} from "react-icons/fa";
import { Mail, MapPin, Phone } from "lucide-react";
import LogoMark from "@/components/LogoMark";

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
              <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              Shahdara, Delhi – 110032
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 flex-shrink-0" />
              +91 836 842 2490
            </p>
            <p className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
              officialgirlyhub@gmail.com
            </p>
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


      <div className="relative flex flex-col items-center gap-2 pt-6 text-center text-xs text-pink-100/60">
        <p>© {new Date().getFullYear()} GirlyHub. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
