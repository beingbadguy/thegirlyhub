export default function TermsOfService() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-16 min-h-[60vh]">
      <h1 className="mb-2 text-3xl md:text-4xl font-bold text-gray-900">
        Terms of Service
      </h1>
      <p className="mb-10 text-sm text-gray-500">
        Last updated: 29 August 2026
      </p>

      <div className="space-y-8 text-gray-700 leading-7">

        <p>
          Welcome to <span className="font-semibold">GirlyHub</span>. By accessing
          or using our website, you agree to comply with and be bound by the
          following terms and conditions.
        </p>

        {/* SECTION */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            1. General
          </h2>
          <p>
            By using this website, you confirm that you are at least 18 years old
            or accessing it under parental supervision.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            2. Products & Pricing
          </h2>
          <p>
            All products are subject to availability. GirlyHub reserves the right
            to modify or discontinue any product or pricing without prior notice.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            3. Orders
          </h2>
          <p>
            Placing an order means you agree to purchase the product. We reserve
            the right to cancel any order due to stock issues, payment failure,
            or suspicious activity.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            4. Payments
          </h2>
          <p>
            We accept prepaid payments via UPI, cards, and Cash on Delivery
            (COD). Orders are processed after payment confirmation (except COD).
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            5. Shipping & Delivery
          </h2>
          <p>
            Delivery timelines are estimates and may vary depending on location
            and logistics conditions.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            6. Returns & Refunds
          </h2>
          <p>
            Please refer to our Returns & Exchange Policy for detailed
            information.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            7. Intellectual Property
          </h2>
          <p>
            All content, including images, text, and logos, belongs to GirlyHub
            and cannot be used without permission.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            8. Limitation of Liability
          </h2>
          <p>
            GirlyHub is not liable for any indirect or incidental damages arising
            from the use of our website or products.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            9. Governing Law
          </h2>
          <p>These terms are governed by the laws of India.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            10. Contact
          </h2>
          <p>
            For any queries, contact us at{" "}
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