import React from "react";
import Image from "next/image";
import { FaQuoteLeft } from "react-icons/fa";
import { HiOutlineSparkles } from "react-icons/hi";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn more about GirlyHub, our vision, and our mission to provide the ultimate online marketplace for trendy accessories, dresses, and high-quality essentials.",
};

const AboutUs = () => {
  return (
    <div className="py-10 md:py-16 lg:py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Discover a World of Possibilities
          </h2>
          <p className="text-gray-600 text-sm md:text-base">
            Your ultimate destination for finding just about anything online.
          </p>
        </section>

        {/* Image Grid */}
        <section className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 md:mb-12">
          <div className="relative overflow-hidden rounded-md shadow-md aspect-w-1 aspect-h-1">
            <Image
              src={"/demo1.avif"}
              alt="Diverse Product 1"
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 hover:scale-105"
            />
          </div>
          <div className="relative overflow-hidden rounded-md shadow-md aspect-w-1 aspect-h-1">
            <Image
              src={"/demo2.avif"}
              alt="Diverse Product 2"
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 hover:scale-105"
            />
          </div>
          <div className="relative overflow-hidden rounded-md shadow-md aspect-w-1 aspect-h-1 hidden md:block">
            <Image
              src={"/demo2.avif"}
              alt="Diverse Product 3"
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 hover:scale-105"
            />
          </div>
          <div className="relative overflow-hidden rounded-md shadow-md aspect-w-1 aspect-h-1">
            <Image
              src={"/demo2.avif"}
              alt="Diverse Product 4"
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 hover:scale-105"
            />
          </div>
          <div className="relative overflow-hidden rounded-md shadow-md aspect-w-1 aspect-h-1">
            <Image
              src={"/demo2.avif"}
              alt="Diverse Product 5"
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 hover:scale-105"
            />
          </div>
          <div className="relative overflow-hidden rounded-md shadow-md aspect-w-1 aspect-h-1 hidden md:block">
            <Image
              src={"/demo2.avif"}
              alt="Diverse Product 6"
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 hover:scale-105"
            />
          </div>
        </section>

        {/* Quote Section */}
        <section className="bg-gray-100 rounded-md py-8 px-6 md:py-12 md:px-10 mb-8 md:mb-12 flex flex-col md:flex-row items-center gap-6">
          <FaQuoteLeft className="text-pink-700 text-4xl md:text-5xl" />
          <blockquote className="text-gray-700 italic text-center md:text-left">
            <p className="mb-4">
              &quot;We&apos;re very much of the &apos;buy anything but buy
              wisely&apos; persuasion. We believe in offering a vast selection
              while ensuring quality and value for every customer.&quot;
            </p>
            <cite className="text-gray-500">- The GirlyHub Team</cite>
          </blockquote>
        </section>

        {/* Our Vision Section */}
        <section className="py-6 md:py-10">
          <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4 flex items-center justify-center md:justify-start">
            <HiOutlineSparkles className="text-pink-700 mr-2" /> Our Vision
          </h3>
          <p className="text-gray-600 leading-relaxed">
            At GirlyHub, our vision is to create the most comprehensive and
            user-friendly online marketplace where you can effortlessly find and
            purchase beautiful lifestyle essentials. From trendy fashion accessories
            and scrunchies to earrings, jewellery, flats, and beautiful dresses,
            we aim to be your trusted destination to express your style.
          </p>
          <p className="text-gray-600 leading-relaxed mt-4">
            We are committed to providing a seamless shopping experience with
            secure transactions, fast shipping, and exceptional customer
            support. Our goal is to empower you with choice and convenience,
            making online shopping a delightful and rewarding experience.
          </p>
        </section>

        {/* Optional Blog/Update Snippet (Similar to the example) */}
        {/* <section className="bg-gray-100 rounded-md py-6 px-6 md:py-8 md:px-8 mt-8 md:mt-12 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <span className="text-pink-700 text-3xl font-bold mr-4">01</span>
            <div>
              <p className="text-gray-500 text-sm">April 9, 2025 - Blog</p>
              <h4 className="text-gray-900 font-semibold">
                Exciting New Arrivals Across All Categories!
              </h4>
              <p className="text-gray-600 text-sm">
                Discover the latest additions to our ever-expanding catalog,
                from electronics to home decor...
              </p>
            </div>
          </div>
          <button className="bg-white text-gray-900 font-semibold py-2 px-4 rounded-md shadow-md hover:bg-gray-200 transition-colors duration-300 flex items-center">
            Read More <FaArrowRight className="ml-2 text-black" />
          </button>
        </section> */}
      </div>
    </div>
  );
};

export default AboutUs;
