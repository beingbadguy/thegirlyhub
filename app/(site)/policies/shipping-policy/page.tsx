import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/seo/config";
import BreadcrumbHome from "@/components/BreadcrumbHome";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy",
  description: "Learn about GirlyHub's shipping timelines, delivery costs, Cash on Delivery (COD), and order tracking across India.",
  alternates: {
    canonical: `${SITE_CONFIG.url}/policies/shipping-policy`,
  },
};

export default function ShippingPolicy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-12 min-h-[60vh]">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-2 text-xs md:text-sm text-neutral-500"
      >
        <BreadcrumbHome />
        <span className="text-neutral-300">/</span>
        <span className="font-semibold text-neutral-900">Shipping & Delivery</span>
      </nav>
      <h1 className="mb-2 text-3xl md:text-4xl font-bold text-gray-900 font-serif">
        Shipping & Delivery Policy
      </h1>
      <p className="mb-10 text-sm text-gray-500">
        Last updated: 29 August 2026
      </p>

      <div className="space-y-8 text-gray-700 leading-7">
        <p>
          At <span className="font-semibold text-gray-900">GirlyHub</span>, we ensure
          fast, secure, and hassle-free delivery for all orders. Below are the
          details regarding our shipping timelines, costs, and processes.
        </p>

        {/* SECTION */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            📦 Order Processing & Dispatch
          </h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <span className="font-medium">Processing Time:</span> Orders are
              processed within 24-48 hours after order placement.
            </li>
            <li>
              <span className="font-medium">
                Custom or Personalized Orders:
              </span>{" "}
              May require an additional 2-3 business days for processing.
            </li>
            <li>
              Orders placed on weekends or public holidays will be processed on
              the next business day.
            </li>
          </ul>
        </div>

        {/* SECTION */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            🚚 Shipping Timelines & Delivery Estimates
          </h2>
          <p className="mb-3">
            We partner with trusted courier services to ensure fast and reliable
            shipping across India.
          </p>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-2.5 font-semibold text-gray-800">
                    Region
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-gray-800">
                    Estimated Delivery Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-2.5">
                    Metro Cities (Delhi, Mumbai, Bangalore, etc.)
                  </td>
                  <td className="px-4 py-2.5">3–5 business days</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5">Tier 2 & 3 Cities</td>
                  <td className="px-4 py-2.5">5–7 business days</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5">Remote Areas</td>
                  <td className="px-4 py-2.5">7–10 business days</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            Delivery times may vary slightly due to weather conditions, festivals, or courier logistics.
          </p>
        </div>

        {/* SECTION */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            💰 Shipping Charges
          </h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <span className="font-medium text-green-600">Free Shipping</span>{" "}
              on orders above or equal to ₹499.
            </li>
            <li>
              For orders below ₹499, a flat shipping fee of{" "}
              <span className="font-medium">₹49</span> applies.
            </li>
            <li>
              <span className="font-medium text-pink-700">
                Cash on Delivery (COD)
              </span>{" "}
              is available across India.
            </li>
          </ul>
        </div>

        {/* SECTION */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            📩 Need Help?
          </h2>
          <p>
            For any shipping-related questions or concerns, please contact us
            at:
          </p>
          <div className="mt-2 space-y-1">
            <p>
              📧{" "}
              <a
                href="mailto:support@girlyhub.in"
                className="text-pink-600 hover:underline font-medium"
              >
                support@girlyhub.in
              </a>
            </p>
            <p>
              📞 Phone:{" "}
              <span className="font-semibold text-gray-900">
                +91 836 842 2490
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
