"use client";

import Image from "next/image";
import { Instagram, ArrowUpRight } from "lucide-react";

export default function InstagramShowcase() {
    return (
        <section className="relative overflow-hidden px-6 py-16 md:px-12 lg:px-20 bg-[#f7f3ec]">

            {/* background grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(82,106,85,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(82,106,85,0.07)_1px,transparent_1px)] bg-[size:34px_34px]" />

            <div className="relative max-w-7xl mx-auto">

                {/* HEADER */}
                <div className="mb-10 flex flex-col gap-7 border-b border-[#ded8cc] pb-8 md:flex-row md:items-end md:justify-between">

                    <div className="max-w-2xl">
                        <p className="text-sm font-bold uppercase tracking-[0.16em] flex items-center gap-2">
                            <span className="w-10 h-px bg-black"></span>
                            Instagram
                        </p>

                        <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-tight">
                            Follow Our Style
                        </h2>

                        <p className="mt-5 text-gray-600">
                            Explore our latest looks, styling inspiration, and behind the scenes moments.
                        </p>
                    </div>

                    <a href="https://www.instagram.com/officialgirlyhub" target="_blank" className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-bold hover:-translate-y-1 transition">
                        <Instagram size={18} />
                        Follow us
                        <ArrowUpRight size={16} />
                    </a>
                </div>

                {/* GRID */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">

                    {/* CARD */}
                    <div className="relative col-span-2 aspect-[1.5/1] overflow-hidden group">
                        <Image src="/i1.png" alt="" fill className="object-cover transition duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition">
                            <div className="w-9 h-9 border border-white rounded-full flex items-center justify-center text-white">
                                <Instagram size={18} />
                            </div>
                            <span className="text-xs font-bold uppercase text-white mt-2">Shop</span>
                        </div>
                    </div>

                    <div className="relative row-span-2 aspect-[0.82/1] overflow-hidden group">
                        <Image src="/i2.png" alt="" fill className="object-cover transition duration-500 group-hover:scale-105" />
                    </div>

                    <div className="relative aspect-square overflow-hidden group">
                        <Image src="/i3.png" alt="" fill className="object-cover transition duration-500 group-hover:scale-105" />
                    </div>

                    <div className="relative aspect-square overflow-hidden group">
                        <Image src="/i4.png" alt="" fill className="object-cover transition duration-500 group-hover:scale-105" />
                    </div>

                    <div className="relative aspect-[0.82/1] overflow-hidden group">
                        <Image src="/i5.png" alt="" fill className="object-cover transition duration-500 group-hover:scale-105" />
                    </div>

                    <div className="relative col-span-2 aspect-[1.5/1] overflow-hidden group">
                        <Image src="/i6.png" alt="" fill className="object-cover transition duration-500 group-hover:scale-105" />
                    </div>

                </div>

                {/* FOOTER */}
                <div className="mt-10 flex items-center gap-3">
                    <span className="w-10 h-px bg-[#bd6f53]" />
                    <p className="text-sm italic text-gray-600">
                        Follow us for daily inspiration
                    </p>
                </div>

            </div>
        </section>
    );
}