"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Heart } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Faqs = () => {
  const [faqs, setFaqs] = useState<
    { _id: string; question: string; answer: string }[]
  >([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    axios
      .get("/api/faq")
      .then((response) => setFaqs(response.data.faqs || []))
      .catch(() => setFaqs([]))
      .finally(() => setLoaded(true));
  }, []);

  if (loaded && faqs.length === 0) return null;

  return (
    <section className="mx-auto py-10 md:py-14">
      <div className="relative overflow-hidden rounded-3xl border border-rose-100/60 bg-[#FFF9FA] px-6 py-12 shadow-[0_25px_50px_-12px_rgba(190,24,93,0.08)] sm:px-10 md:grid md:grid-cols-2 md:gap-16 md:px-16 md:py-16">
        {/* Very subtle background hearts */}
        <img
          src="/hearts.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover object-center opacity-[0.12]"
        />

        {/* Left Content */}
        <div className="flex flex-col justify-center">
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[11px] font-medium tracking-widest text-rose-500 shadow-sm ring-1 ring-rose-100">
            <Heart className="size-3 fill-rose-400 text-rose-400" />
            FAQ
          </div>

          <h2 className="font-serif text-4xl font-medium leading-[1.15] tracking-tight text-rose-950 sm:text-5xl">
            Your questions,
            <br />
            answered with love.
          </h2>

          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-rose-900/60">
            Everything you need to know about your order, delivery, and your
            little essentials.
          </p>

          <p className="mt-8 text-sm font-medium text-rose-500">
            Shopping should feel easy
          </p>
        </div>

        {/* Right Accordion */}
        <div className="mt-10 md:mt-0">
          <div className="rounded-2xl bg-white p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-rose-100/50">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq) => (
                <AccordionItem
                  key={faq._id}
                  value={faq._id}
                  className="border-b border-rose-50 last:border-none"
                >
                  <AccordionTrigger className="px-5 py-5 text-left text-[15px] font-medium text-rose-950 hover:no-underline data-[state=open]:text-rose-700 [&>svg]:size-4 [&>svg]:text-rose-300">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-5 text-[14px] leading-relaxed text-rose-900/65">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Faqs;
