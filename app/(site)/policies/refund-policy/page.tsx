import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/seo/config";
import BreadcrumbHome from "@/components/BreadcrumbHome";
import FloralAccent from "@/components/decorations/FloralAccent";

export const metadata: Metadata = {
  title: "Return & Refund Policy",
  description: "Read the GirlyHub return, refund, and exchange policy for accessories and jewellery orders.",
  alternates: {
    canonical: `${SITE_CONFIG.url}/policies/refund-policy`,
  },
};

export default function RefundPolicy() {
  return (
    <div className="relative overflow-hidden min-h-[60vh] bg-[#fffafb]">
      {/* Background ambient flower */}
      <div className="pointer-events-none absolute right-[-40px] top-12 hidden opacity-15 lg:block select-none">
        <FloralAccent flower={1} size="xl" animation="float" />
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 md:py-12 relative z-10">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-2 text-xs md:text-sm text-neutral-500"
        >
          <BreadcrumbHome />
          <span className="text-neutral-300">/</span>
          <span className="font-semibold text-neutral-900">Return & Refund</span>
        </nav>
        {/* Heading */}
        <div className="flex items-center gap-2 mb-2">
          <FloralAccent flower={1} size="sm" animation="pulse" />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight font-serif">
            Return & Refund Policy
          </h1>
        </div>
        <p className="mb-10 text-sm text-gray-500">
          Last updated: 29 August 2026
        </p>


        <div className="space-y-8 text-gray-700 leading-7 text-[15px]">
          {/* Intro */}
          <p>
            At <span className="font-semibold text-gray-900">GirlyHub</span>, we
            strive to deliver high-quality products and a smooth shopping
            experience. If you are not satisfied with your purchase, you can
            request a return or exchange under the conditions below.
          </p>

          {/* RETURN */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              1. Return Policy
            </h2>

            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="font-medium">Return Window:</span> Returns must
                be requested within <span className="font-medium">24 hours</span>{" "}
                of delivery.
              </li>

              <li>
                <span className="font-medium">Eligibility:</span> Items must be
                unused, in original packaging, and in the same condition as
                received.
              </li>

              <li>
                <span className="font-medium">How to Request:</span> Contact us
                via email with your order ID and reason for return.
              </li>

              <li>
                <span className="font-medium">Return Shipping:</span> Customers
                are responsible for return shipping unless the item is defective
                or incorrect.
              </li>

              <li>
                <span className="font-medium">Refund Timeline:</span> Refunds are
                processed within{" "}
                <span className="font-medium">5–7 business days</span> after
                inspection.
              </li>

              <li>
                <span className="font-medium">Shipping Charges:</span>{" "}
                Non-refundable.
              </li>

              <li>
                <span className="font-medium">COD Orders:</span> Refunds will be
                provided as store credit in your GirlyHub account.
              </li>
            </ul>
          </div>

          {/* EXCHANGE */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              2. Exchange Policy
            </h2>

            <ul className="list-disc pl-5 space-y-2">
              <li>Available only for damaged, defective, or wrong items</li>
              <li>Request must be raised within 24 hours of delivery</li>
              <li>Replacement will be shipped after product verification</li>
            </ul>
          </div>

          {/* NON RETURNABLE */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              3. Non-Returnable Items
            </h2>

            <ul className="list-disc pl-5 space-y-2">
              <li>Customized or personalized items</li>
              <li>Earrings (for hygiene reasons)</li>
              <li>Items purchased during sale</li>
              <li>Products priced under ₹99</li>
            </ul>
          </div>

          {/* DAMAGED */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              4. Damaged or Incorrect Items
            </h2>
            <p>
              If you receive a damaged or incorrect product, please contact us
              within <span className="font-medium">24 hours</span> with proper
              images for faster resolution.
            </p>
          </div>

          {/* CONTACT */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              5. Contact Us
            </h2>
            <p>For any return, exchange, or refund queries:</p>

            <div className="mt-2 space-y-1">
              <p className="font-medium text-gray-900">
                officialgirlyhub@gmail.com
              </p>
              <p className="font-medium text-gray-900">Phone: +91 836 842 2490</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
