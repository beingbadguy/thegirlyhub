export default function RefundPolicy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-16 min-h-[60vh]">
      <h1 className="mb-2 text-3xl md:text-4xl font-bold text-gray-900">
        Return & Refund Policy
      </h1>
      <p className="mb-10 text-sm text-gray-500">
        Last updated: 29 August 2026
      </p>

      <div className="space-y-8 text-gray-700 leading-7">

        <p>
          At <span className="font-semibold">GirlyHub</span>, we aim to provide
          the best shopping experience. If you are not completely satisfied with
          your purchase, you may request a return or refund under the conditions
          below.
        </p>

        {/* SECTION */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            1. Return Window
          </h2>
          <p>
            Returns can be requested within{" "}
            <span className="font-medium">7 days</span> of delivery.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            2. Eligibility for Returns
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Item must be unused and in original condition</li>
            <li>All tags and packaging should be intact</li>
            <li>Proof of purchase is required</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            3. Non-Returnable Items
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Customized or personalized products</li>
            <li>Personal use items (for hygiene reasons)</li>
            <li>Items marked as non-returnable</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            4. Damaged or Incorrect Products
          </h2>
          <p>
            If you receive a damaged or incorrect item, please contact us within{" "}
            <span className="font-medium">48 hours</span> of delivery with clear
            photos for quick resolution.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            5. Refund Process
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Refunds are processed within 5–7 business days after inspection</li>
            <li>Prepaid orders → refunded to original payment method</li>
            <li>COD orders → refunded via UPI or bank transfer</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            6. Return Shipping
          </h2>
          <p>
            Return shipping is free for damaged or incorrect items. In other
            cases, shipping charges may be applicable.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            7. Exchanges
          </h2>
          <p>
            Exchanges are subject to product availability. If the requested item
            is unavailable, a refund will be issued.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            8. Contact Us
          </h2>
          <p>
            To initiate a return or refund, contact us at{" "}
            <span className="font-medium text-gray-900 block">
              officialgirlyhub@gmail.com
            </span>
            <span className="font-medium text-gray-900 block">
              Phone: 96675549765
            </span>
          </p>
        </div>

      </div>
    </div>
  );
}