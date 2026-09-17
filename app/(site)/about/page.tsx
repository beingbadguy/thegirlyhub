import React from "react";
import Image from "next/image";
import { FaQuoteLeft } from "react-icons/fa";
import { HiOutlineSparkles } from "react-icons/hi";
import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import BreadcrumbHome from "@/components/BreadcrumbHome";
import { SITE_CONFIG } from "@/lib/seo/config";
import { generateBreadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "About Us | Our Story & Mission",
  description:
    "Learn about GirlyHub's journey to deliver trendy hair accessories, Korean clips, scrunchies, and high-quality fashion jewellery across India.",
  alternates: {
    canonical: `${SITE_CONFIG.url}/about`,
  },
  openGraph: {
    title: `About Us | ${SITE_CONFIG.name}`,
    description:
      "Learn about GirlyHub's journey to deliver trendy hair accessories, Korean clips, scrunchies, and high-quality fashion jewellery across India.",
    url: `${SITE_CONFIG.url}/about`,
    siteName: SITE_CONFIG.name,
  },
};

const AboutUs = () => {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "About Us", url: "/about" },
  ]);

  return (
    <div className="py-6 sm:py-8 bg-[#fffafb] min-h-[70vh]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <JsonLd data={breadcrumbSchema} />
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-2 text-xs md:text-sm text-neutral-500"
        >
          <BreadcrumbHome />
          <span className="text-neutral-300">/</span>
          <span className="font-semibold text-neutral-900">About Us</span>
        </nav>
        {/* Hero Section */}
        <section className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 font-serif">
            Discover the Sparkle of GirlyHub
          </h1>
          <p className="text-gray-600 text-sm md:text-base max-w-xl mx-auto">
            Your ultimate destination for trendy hair claws, aesthetic jewellery, scrunchies, and cute essentials.
          </p>
        </section>

        {/* Image Grid */}
        <section className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 md:mb-12">
          <div className="relative overflow-hidden rounded-xl shadow-sm aspect-square">
            <Image
              src="/demo1.avif"
              alt="GirlyHub Curated Hair Accessories"
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
          <div className="relative overflow-hidden rounded-xl shadow-sm aspect-square">
            <Image
              src="/demo2.avif"
              alt="GirlyHub Aesthetic Jewellery"
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
          <div className="relative overflow-hidden rounded-xl shadow-sm aspect-square hidden md:block">
            <Image
              src="/demo2.avif"
              alt="GirlyHub Korean Hair Claws"
              fill
              sizes="33vw"
              className="object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
        </section>

        {/* Quote Section */}
        <section className="bg-rose-50/50 border border-rose-100/60 rounded-2xl py-8 px-6 md:py-12 md:px-10 mb-8 md:mb-12 flex flex-col md:flex-row items-center gap-6">
          <FaQuoteLeft className="text-rose-400 text-4xl md:text-5xl shrink-0" />
          <blockquote className="text-gray-700 italic text-center md:text-left">
            <p className="mb-3 text-base md:text-lg">
              &quot;We believe every girl deserves high quality, adorable accessories that make her feel confident and radiant every single day.&quot;
            </p>
            <cite className="text-rose-600 font-semibold not-italic">- The GirlyHub Team</cite>
          </blockquote>
        </section>

        {/* Our Vision Section */}
        <section className="py-6 md:py-10">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4 flex items-center justify-center md:justify-start">
            <HiOutlineSparkles className="text-pink-600 mr-2" /> Our Vision & Promise
          </h2>
          <p className="text-gray-600 leading-relaxed">
            At GirlyHub, our vision is to curate the most joyful, accessible, and high-quality collection of accessories online. From trendy Korean hair claws and soft satin scrunchies to hypoallergenic earrings, delicate necklaces, and lifestyle essentials, we bring you style that speaks to your personality.
          </p>
          <p className="text-gray-600 leading-relaxed mt-4">
            We are dedicated to offering seamless shopping with Cash on Delivery (COD), express dispatch, secure payments, and attentive customer service across India.
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;
