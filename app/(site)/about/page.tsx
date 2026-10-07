import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Heart,
  ShieldCheck,
  Gift,
  Truck,
  Star,
  ArrowRight,
  Instagram,
  CheckCircle2,
  Clock,
  Sparkle,
} from "lucide-react";
import { FaQuoteLeft } from "react-icons/fa";
import { HiOutlineSparkles } from "react-icons/hi";
import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import BreadcrumbHome from "@/components/BreadcrumbHome";
import FloralAccent from "@/components/decorations/FloralAccent";
import { SITE_CONFIG } from "@/lib/seo/config";
import { generateAboutPageSchema, generateBreadcrumbSchema } from "@/lib/seo/schema";

import OurStorySection from "@/components/OurStorySection";

export const metadata: Metadata = {
  title: "About GirlyHub",
  description:
    "Discover the story behind GirlyHub — handcrafted hair claws, hypoallergenic dainty jewellery, satin scrunchies, and cute daily essentials delivered across India with love.",
  alternates: {
    canonical: `${SITE_CONFIG.url}/about`,
  },
  openGraph: {
    title: `About Us | ${SITE_CONFIG.name}`,
    description:
      "Discover the story behind GirlyHub — handcrafted hair claws, hypoallergenic dainty jewellery, satin scrunchies, and cute daily essentials delivered across India with love.",
    url: `${SITE_CONFIG.url}/about`,
    siteName: SITE_CONFIG.name,
    images: [
      {
        url: "/girlyhub_logo_flower_transparent.png",
        width: 1200,
        height: 630,
        alt: "GirlyHub - About Us",
      },
    ],
  },
};

const lookbookItems = [
  {
    title: "Korean Hair Claws & Clips",
    tagline: "Strong hold, snag-free teeth, zero headaches.",
    tag: "Signature Hold",
    image: "/i1.png",
    aspect: "aspect-[4/5]",
  },
  {
    title: "Anti-Tarnish Dainty Jewellery",
    tagline: "Water-friendly & hypoallergenic for everyday shine.",
    tag: "Everyday Luxe",
    image: "/i2.png",
    aspect: "aspect-[4/5]",
  },
  {
    title: "Luxe Satin Scrunchies & Bows",
    tagline: "Silk-smooth glide with zero friction or breakage.",
    tag: "Silk & Satin",
    image: "/i3.png",
    aspect: "aspect-[4/5]",
  },
  {
    title: "Cute Vanity & Daily Accents",
    tagline: "Playful, joyful pieces that brighten your vanity.",
    tag: "Aesthetic Charm",
    image: "/i5.png",
    aspect: "aspect-[4/5]",
  },
];

const brandPromises = [
  {
    icon: Sparkles,
    title: "Hair-Safe Zero-Pull Design",
    description:
      "We thoroughly test every claw clip spring, hinge, and tooth. Smooth, rounded edges ensure a firm, all-day hold without pulling delicate hair strands or causing tension headaches.",
    accent: "bg-rose-50 text-rose-600 border-rose-100",
  },
  {
    icon: ShieldCheck,
    title: "Sensitive-Skin Friendly",
    description:
      "Our dainty necklaces, earrings, and rings are made with hypoallergenic, nickel-free, and lead-free alloys. Enjoy gorgeous sparkle without green marks or skin irritation.",
    accent: "bg-amber-50 text-amber-700 border-amber-100",
  },
  {
    icon: Heart,
    title: "Accessible Everyday Luxury",
    description:
      "We believe high-end Korean minimalism and Pinterest-worthy trends shouldn't come with exorbitant markups. Thoughtfully crafted accessories at honest, transparent prices.",
    accent: "bg-pink-50 text-pink-600 border-pink-100",
  },
  {
    icon: Gift,
    title: "Gift-Wrapped With Love",
    description:
      "Every order arrives wrapped in soft pastel tissue paper, accompanied by lovely floral care notes and cute stickers — because unboxing your order should feel like a celebration.",
    accent: "bg-purple-50 text-purple-600 border-purple-100",
  },
];

const customerTestimonials = [
  {
    name: "Rhea Kapoor",
    city: "Mumbai",
    rating: 5,
    verified: true,
    product: "Jumbo Korean Claw Clip",
    quote:
      "I have very thick, wavy hair and had honestly given up on claw clips until I tried GirlyHub. It holds up my hair through an entire 8-hour college day without sagging once. Truly obsessed!",
  },
  {
    name: "Pooja Sharma",
    city: "Bengaluru",
    rating: 5,
    verified: true,
    product: "Dainty Butterfly Pendant",
    quote:
      "I have extremely sensitive skin and usually react to fashion jewellery. I've worn my GirlyHub necklace continuously for 3 months now — no itching, zero tarnishing, and countless compliments!",
  },
  {
    name: "Tanvi Malhotra",
    city: "New Delhi",
    rating: 5,
    verified: true,
    product: "Silk Satin Scrunchie Set",
    quote:
      "Opening my GirlyHub parcel felt like opening a birthday present! The soft pink wrapping, the sweet thank you card, and the sheer quality of the scrunchies made my day. 10/10!",
  },
];

const milestones = [
  { value: "100+", label: "Happy Packages Delivered", icon: Truck },
  { value: "4.9 / 5.0", label: "Average Customer Rating", icon: Star },
  // { value: "28,000+", label: "Pincodes Covered with COD", icon: CheckCircle2 },
  { value: "28,000+", label: "Pincodes Covered Across India", icon: CheckCircle2 },
  { value: "500+", label: "Curated Aesthetic Designs", icon: Sparkle },
];

const AboutUs = () => {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "About Us", url: "/about" },
  ]);
  const aboutSchema = generateAboutPageSchema();

  return (
    <main className="py-6 sm:py-10 bg-[#fffafb] min-h-[70vh] relative overflow-hidden">
      {/* Background ambient florals */}
      <div className="pointer-events-none absolute right-[-20px] top-28 hidden opacity-25 lg:block select-none">
        <FloralAccent flower={1} size="xl" animation="float" />
      </div>
      <div className="pointer-events-none absolute left-[-20px] top-[40%] hidden opacity-20 lg:block select-none">
        <FloralAccent flower={3} size="lg" animation="sway" />
      </div>
      <div className="pointer-events-none absolute right-[-20px] bottom-40 hidden opacity-20 lg:block select-none">
        <FloralAccent flower={2} size="lg" animation="float-delayed" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <JsonLd data={breadcrumbSchema} />
        <JsonLd data={aboutSchema} />

        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex items-center gap-2 text-xs md:text-sm text-neutral-500"
        >
          <BreadcrumbHome />
          <span className="text-neutral-300">/</span>
          <span className="font-semibold text-neutral-900 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/50">
            About Us
          </span>
        </nav>

        {/* Hero Section */}
        <section className="text-center mb-12 md:mb-16 max-w-4xl mx-auto">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-200/80 bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#8a3348] shadow-2xs backdrop-blur-xs mb-4">
            <HiOutlineSparkles className="size-3.5 text-pink-500" />
            <span>The GirlyHub Story & Mission</span>
            <HiOutlineSparkles className="size-3.5 text-pink-500" />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal text-[#4e1a27] font-cormorant tracking-[0.01em] leading-tight">
            Where Everyday Style Meets <br className="hidden sm:inline" />
            <span className="italic font-light text-[#874b5c]">Pure Everyday Radiance</span>
          </h1>

          <p className="mt-5 text-gray-600 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-sans">
            GirlyHub is an accessories brand crafted with a heartfelt promise: to deliver trendsetting Korean hair accessories, tarnish-resistant aesthetic jewellery, and delightful daily essentials to women across India with love and uncompromising quality.
          </p>

          {/* Quick Highlights Ribbon */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs sm:text-sm text-[#532431]">
            {/* <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-rose-200/60 px-3.5 py-1.5 shadow-2xs">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              <strong className="font-semibold">4.9/5 Rating</strong> (1,500+ Reviews)
            </span> */}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-rose-200/60 px-3.5 py-1.5 shadow-2xs">
              <Heart className="size-3.5 fill-rose-500 text-rose-500" />
              <strong className="font-semibold">100+</strong> Happy GirlyHubbers
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-rose-200/60 px-3.5 py-1.5 shadow-2xs">
              <Truck className="size-3.5 text-[#8a3348]" />
              <strong className="font-semibold">Pan-India Delivery</strong> & Express Dispatch
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-emerald-200/80 px-3.5 py-1.5 shadow-2xs">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              <span className="text-[#3b2029]">
                <strong className="font-semibold">Govt. MSME Registered:</strong>{" "}
                <span className="font-mono text-xs font-semibold text-[#532431]">UDYAM-DL-07-0026329</span>
              </span>
            </span>
          </div>
        </section>

        {/* Visual Lookbook Showcase ("The GirlyHub Aesthetic") */}
        <section className="mb-14 sm:mb-20">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#a04a60]">
              Curated Collections
            </span>
            <h2 className="font-cormorant text-2xl sm:text-3xl md:text-4xl text-[#4e1a27] font-normal mt-1">
              The GirlyHub Aesthetic
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-2">
              Every design is thoughtfully tested for everyday wear, comfort, and timeless charm.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-5">
            {lookbookItems.map((item, idx) => (
              <div
                key={idx}
                className="group relative overflow-hidden rounded-2xl bg-white border border-rose-100/80 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col"
              >
                <div className={`relative w-full ${item.aspect} overflow-hidden bg-rose-50`}>
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 300px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-70 group-hover:opacity-60 transition-opacity" />

                  {/* Badge */}
                  <span className="absolute top-2.5 left-2.5 rounded-full bg-white/90 backdrop-blur-xs border border-white/60 px-2.5 py-0.5 text-[10px] font-semibold text-[#6e1e32] shadow-xs">
                    {item.tag}
                  </span>
                </div>

                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-[#4e1a27] line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                      {item.tagline}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Luxury Editorial Story Section */}
        <OurStorySection
          title="Our Story"
          subtitle="Designed for the girl who celebrates the beauty in little moments."
          badge="A Journey of Passion & Sparkle"
          paragraphs={[
            "GirlyHub began with an everyday frustration we know all too well: claw clips that snapped after two wears, metal hairpins that pulled out hair, and dainty jewellery that turned green within weeks of purchase. We believed that modern women deserved so much better.",
            "I've always believed that the little details define how we feel. A perfectly holding claw clip that doesn't pull your hair, a delicate hypoallergenic pendant that catches the sun, or dainty rings that make everyday moments feel special — every piece should celebrate you, effortlessly and comfortably.",
            "So we created GirlyHub for the woman who creates, dreams, and defines her own style — accessories that blend premium quality with joyful designs, made for real, everyday life.",
          ]}
          signature="Team GirlyHub"
          signatureSubtitle="Curated with love in New Delhi, India"
          showImages={true}
          showFeatures={true}
        />

        {/* The 4 GirlyHub Promises / Why We Are Different */}
        <section className="my-14 sm:my-20">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#a04a60]">
              Our Quality Commitment
            </span>
            <h2 className="font-cormorant text-3xl sm:text-4xl text-[#4e1a27] font-normal mt-1">
              The GirlyHub Standard
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-2">
              Why thousands of women across India make GirlyHub their first choice for accessories.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {brandPromises.map((promise, idx) => {
              const Icon = promise.icon;
              return (
                <div
                  key={idx}
                  className="bg-white/80 backdrop-blur-xs border border-rose-100/80 rounded-3xl p-6 sm:p-8 shadow-xs hover:shadow-md transition-shadow flex flex-col sm:flex-row items-start gap-4 sm:gap-5"
                >
                  <div
                    className={`size-12 sm:size-14 rounded-2xl border flex items-center justify-center shrink-0 ${promise.accent}`}
                  >
                    <Icon className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-[#4e1a27]">
                      {promise.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed font-sans">
                      {promise.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Milestone / By The Numbers Strip */}
        <section className="my-12 sm:my-16 bg-gradient-to-r from-[#faeef2] via-[#fcf5f1] to-[#faeef2] border border-rose-200/70 rounded-3xl p-6 sm:p-10 shadow-xs">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {milestones.map((m, idx) => {
              const Icon = m.icon;
              return (
                <div key={idx} className="flex flex-col items-center">
                  <div className="size-11 rounded-full bg-white/90 text-[#8a2a44] border border-rose-200/60 flex items-center justify-center mb-3 shadow-2xs">
                    <Icon className="size-5" />
                  </div>
                  <span className="font-cormorant text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#4e1a27] tracking-tight">
                    {m.value}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-600 mt-1 font-medium">
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Real Customer Love / Community Voices */}
        <section className="my-14 sm:my-20">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#a04a60]">
              Loved by GirlyHubbers
            </span>
            <h2 className="font-cormorant text-3xl sm:text-4xl text-[#4e1a27] font-normal mt-1">
              Words From Our Community
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-2">
              Real reviews from real women styling their everyday moments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {customerTestimonials.map((review, idx) => (
              <div
                key={idx}
                className="bg-white border border-rose-100/90 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed italic font-serif">
                    &ldquo;{review.quote}&rdquo;
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-rose-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-[#4e1a27]">
                      {review.name}
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      {review.city} • Verified Buyer
                    </p>
                  </div>
                  <span className="text-[10px] font-medium text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
                    {review.product}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Vision & Promise Callout Card */}
        <section className="my-10 sm:my-14 bg-white/80 backdrop-blur-xs border border-rose-100/80 rounded-3xl p-6 sm:p-10 shadow-xs relative overflow-hidden">
          <div className="pointer-events-none absolute right-[-20px] bottom-[-20px] opacity-20 select-none">
            <FloralAccent flower={1} size="lg" animation="pulse" />
          </div>

          <div className="relative z-10 max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <FloralAccent flower={3} size="xs" animation="sway" />
              <h2 className="text-xl sm:text-2xl md:text-3xl font-normal text-[#4e1a27] font-cormorant flex items-center gap-2">
                <HiOutlineSparkles className="text-pink-600 size-5" />
                Our Vision & Delivery Guarantee
              </h2>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm md:text-base leading-relaxed">
              At GirlyHub, our vision is to curate the most joyful, accessible, and high-quality collection of accessories in India. From trendy Korean hair claws and soft satin scrunchies to hypoallergenic earrings, delicate necklaces, and lifestyle essentials, we bring you style that speaks to your personality.
            </p>
            {/*
            <p className="text-gray-600 text-xs sm:text-sm md:text-base leading-relaxed mt-3">
              We are dedicated to offering seamless shopping with Cash on Delivery (COD), express dispatch within 24 hours, tamper-proof packaging, and attentive customer care on WhatsApp and Email.
            </p>
            */}
            <p className="text-gray-600 text-xs sm:text-sm md:text-base leading-relaxed mt-3">
              We are dedicated to offering seamless shopping with fast online checkout, express dispatch within 24 hours, tamper-proof packaging, and attentive customer care on WhatsApp and Email.
            </p>
          </div>
        </section>

        {/* Community & Shopping CTA Banner */}
        <section className="my-12 sm:my-16 relative overflow-hidden rounded-3xl sm:rounded-4xl bg-gradient-to-br from-[#531828] via-[#661e31] to-[#3a0f1b] text-white p-8 sm:p-12 lg:p-16 text-center shadow-lg">
          {/* Subtle background glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-rose-500/20 via-transparent to-transparent opacity-60" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1 text-xs font-medium tracking-widest uppercase text-pink-200 backdrop-blur-xs mb-4">
              <Sparkles className="size-3.5 text-pink-300" />
              Join the GirlyHub Community
            </span>

            <h2 className="font-cormorant text-3xl sm:text-4xl md:text-5xl font-normal tracking-[0.01em] leading-tight">
              Ready to Add a Little <br className="hidden sm:inline" />
              <span className="italic font-light text-rose-200">Sparkle to Your Day?</span>
            </h2>

            <p className="mt-4 text-xs sm:text-sm md:text-base text-pink-100/80 leading-relaxed font-sans">
              Discover our newest drops or join 25,000+ girls on Instagram for daily hair styling inspiration, giveaways, and styling secrets.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                href="/newarrivals"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-[#531828] shadow-md hover:bg-rose-50 hover:scale-105 transition-all duration-200"
              >
                <span>Shop New Arrivals</span>
                <ArrowRight className="size-4" />
              </Link>

              <a
                href="https://www.instagram.com/officialgirlyhub"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-pink-300/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-xs hover:bg-white/20 transition-all duration-200"
              >
                <Instagram className="size-4 text-pink-300" />
                <span>Follow @officialgirlyhub</span>
              </a>
            </div>

            {/*
            <p className="mt-6 text-[11px] sm:text-xs text-pink-200/60 font-sans">
              Cash on Delivery Available • Express Pan-India Shipping • Hassle-Free Support
            </p>
            */}
            <p className="mt-6 text-[11px] sm:text-xs text-pink-200/60 font-sans">
              Express Pan-India Shipping • Hassle-Free Support • 100% Free Delivery
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AboutUs;
