import React from "react";
import Image from "next/image";
import { FaQuoteLeft } from "react-icons/fa";
import { HiOutlineSparkles } from "react-icons/hi";
import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import BreadcrumbHome from "@/components/BreadcrumbHome";
import FloralAccent from "@/components/decorations/FloralAccent";
import { SITE_CONFIG } from "@/lib/seo/config";
import { generateBreadcrumbSchema } from "@/lib/seo/schema";

import OurStorySection from "@/components/OurStorySection";

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
    <div className="py-6 sm:py-8 bg-[#fffafb] min-h-[70vh] relative overflow-hidden">
      {/* Background ambient florals */}
      <div className="pointer-events-none absolute right-[-30px] top-24 hidden opacity-25 lg:block select-none">
        <FloralAccent flower={1} size="xl" animation="float" />
      </div>
      <div className="pointer-events-none absolute left-[-20px] bottom-32 hidden opacity-20 lg:block select-none">
        <FloralAccent flower={3} size="lg" animation="sway" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
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
          <div className="inline-flex items-center gap-2 mb-2">
            <FloralAccent flower={1} size="sm" animation="pulse" />
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-normal text-[#4e1a27] font-cormorant tracking-[0.02em]">
              Discover the Sparkle of GirlyHub
            </h1>
            <FloralAccent flower={1} size="sm" animation="pulse" className="rotate-45" />
          </div>
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

        {/* Luxury Editorial Story Section */}
        <OurStorySection
          title="Our Story"
          paragraphs={[
            "GirlyHub is a curated, solutions-oriented accessories brand, crafted to bring everyday sparkle, effortless grace, and confidence to women across India.",
            `"I've always believed that the little details define how we feel. A perfectly holding claw clip that doesn't pull your hair, a delicate hypoallergenic pendant that catches the sun, or dainty rings that make everyday moments feel special — every piece should celebrate you, effortlessly and comfortably."`,
            "So we created GirlyHub, for the woman who creates, dreams, and defines her own style — accessories that blend premium quality with joyful designs, made for real, everyday life.",
          ]}
          signature="GirlyHub, curated with love"
        />

        {/* Our Vision Section */}
        <section className="py-6 md:py-10 bg-white/70 backdrop-blur-xs border border-rose-100/60 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
            <FloralAccent flower={3} size="sm" animation="sway" />
            <h2 className="text-2xl md:text-3xl font-normal text-[#4e1a27] flex items-center font-cormorant">
              <HiOutlineSparkles className="text-pink-600 mr-2" /> Our Vision & Promise
            </h2>
          </div>
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
