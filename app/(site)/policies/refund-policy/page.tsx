import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/seo/config";
import BreadcrumbHome from "@/components/BreadcrumbHome";
import FloralAccent from "@/components/decorations/FloralAccent";
import JsonLd from "@/components/seo/JsonLd";
import { generateBreadcrumbSchema, generatePolicyPageSchema } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "Replacement & Return Policy",
  description:
    "No exchange or return. Replacement is applicable only for defective items, with a mandatory unboxing video recorded within 24 hours of delivery.",
  alternates: {
    canonical: `${SITE_CONFIG.url}/policies/refund-policy`,
  },
  openGraph: {
    title: `Replacement & Return Policy | ${SITE_CONFIG.name}`,
    description:
      "No exchange or return. Replacement is applicable only for defective items, with a mandatory unboxing video recorded within 24 hours of delivery.",
    url: `${SITE_CONFIG.url}/policies/refund-policy`,
    type: "website",
    images: [SITE_CONFIG.ogImage],
  },
  twitter: { card: "summary_large_image", images: [SITE_CONFIG.ogImage] },
};

export default function RefundPolicy() {
  const canonicalUrl = `${SITE_CONFIG.url}/policies/refund-policy`;
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Replacement Policy", url: "/policies/refund-policy" },
  ]);
  const policySchema = generatePolicyPageSchema(
    "Replacement & Return Policy",
    "Replacement policy guidelines for orders placed at GirlyHub.",
    canonicalUrl
  );

  return (
    <main className="relative overflow-hidden min-h-[60vh] bg-[#fffafb]">
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={policySchema} />
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
          <span className="font-semibold text-neutral-900">Replacement Policy</span>
        </nav>

        {/* Heading */}
        <div className="flex items-center gap-2 mb-2">
          <FloralAccent flower={1} size="sm" animation="pulse" />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight font-serif">
            Replacement &amp; Return Policy
          </h1>
        </div>
        <p className="mb-10 text-sm text-gray-500">
          Last updated: October 2026
        </p>

        <div className="space-y-8 text-gray-700 leading-7 text-[15px]">
          {/* Main Replacement Policy Notice */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5 sm:p-6 text-rose-950 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold font-serif text-[#4e1a27] mb-2">
              Important Policy Notice
            </h2>
            <p className="text-sm sm:text-base font-semibold text-[#8a2a44] leading-relaxed">
              No exchange or return. Replacement is applicable only for defective items, with a mandatory unboxing video recorded within 24 hours of delivery.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              1. Policy Guidelines &amp; Unboxing Video Requirement
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="font-semibold text-gray-900">No Return or Exchange:</span> We do not accept returns or exchanges for change of mind, sizing, or styling preference.
              </li>
              <li>
                <span className="font-semibold text-gray-900">Defective Piece Replacement Only:</span> A replacement will be provided solely in the event that an item arrived damaged or with a manufacturing defect.
              </li>
              <li>
                <span className="font-semibold text-gray-900">Mandatory Unboxing Video:</span> An unboxing video is compulsory for all replacement claims. The video must start before opening the sealed courier bag and clearly show the shipping label, packaging, and the defect without any cuts or editing.
              </li>
              <li>
                <span className="font-semibold text-gray-900">Strict 24-Hour Window:</span> You must notify us with the unboxing video within <span className="font-semibold text-rose-700">24 hours of delivery</span>. Claims submitted after 24 hours or without an unboxing video will not be entertained.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              2. How to Request a Defective Item Replacement
            </h2>
            <p>
              If you received a defective piece, please reach out to our team within 24 hours of delivery with your order ID, photos of the item, and the unboxing video:
            </p>

            <div className="mt-3 space-y-1.5 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
              <p>📧 Email: <strong className="text-gray-900">officialgirlyhub@gmail.com</strong></p>
              <p>📱 WhatsApp / Phone: <strong className="text-gray-900">+91 836 842 2490</strong></p>
            </div>
          </div>

          {/* Previous Return & Refund Policy - Commented out for now
          <p>
            At <span className="font-semibold text-gray-900">GirlyHub</span>, we
            strive to deliver high-quality products and a smooth shopping
            experience. If you are not satisfied with your purchase, you can
            request a return or exchange under the conditions below.
          </p>

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
                <span className="font-medium">Free Initial Delivery:</span> Initial standard delivery is 100% free with no delivery charges at checkout on all orders across India.
              </li>

              <li>
                <span className="font-medium">Return Shipping:</span> Shipping charges apply only in the event of a customer return or exchange. Customers are responsible for return shipping unless the item arrived damaged, defective, or incorrect.
              </li>

              <li>
                <span className="font-medium">Refund Timeline:</span> Refunds are
                processed within{" "}
                <span className="font-medium">5–7 business days</span> after
                inspection.
              </li>

              <li>
                <span className="font-medium">Shipping Charges:</span>{" "}
                Non-refundable for return shipments.
              </li>
            </ul>
          </div>

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
          */}

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
    </main>
  );
}
