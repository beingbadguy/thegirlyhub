export default function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-16 min-h-[60vh]">
      <h1 className="mb-2 text-3xl md:text-4xl font-bold text-gray-900">
        Privacy Policy
      </h1>
      <p className="mb-10 text-sm text-gray-500">
        Last updated: 29 August 2026
      </p>

      <div className="space-y-8 text-gray-700 leading-7">

        <p>
          At <span className="font-semibold">GirlyHub</span>, we value your
          privacy and are committed to protecting your personal information.
        </p>

        {/* SECTION */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            1. Information We Collect
          </h2>
          <p>
            We collect personal details such as your name, phone number, email
            address, and shipping address when you place an order or interact
            with our website.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            2. How We Use Your Information
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To process and deliver your orders</li>
            <li>To provide customer support</li>
            <li>To improve our products and services</li>
            <li>To send updates, offers, and promotions (only if you opt-in)</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            3. Sharing of Information
          </h2>
          <p>
            We may share your information with trusted third parties such as:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Delivery partners for order fulfillment</li>
            <li>Payment gateways for secure transactions</li>
          </ul>
          <p className="mt-2">
            We do not sell, rent, or trade your personal data to any third party.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            4. Data Security
          </h2>
          <p>
            We implement appropriate security measures to protect your personal
            information from unauthorized access, misuse, or disclosure.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            5. Cookies
          </h2>
          <p>
            Our website uses cookies to enhance your browsing experience and
            analyze website traffic.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            6. Your Rights
          </h2>
          <p>
            You have the right to access, update, or request deletion of your
            personal data at any time.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            7. Contact Us
          </h2>
          <p>
            If you have any questions about this Privacy Policy, you can contact
            us at{" "}
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