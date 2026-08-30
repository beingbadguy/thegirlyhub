export default function ShippingPolicy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-16 min-h-[60vh]">
      <h1 className="mb-2 text-3xl md:text-4xl font-bold text-gray-900">
        Shipping Policy
      </h1>
      <p className="mb-10 text-sm text-gray-500">
        Last updated: 29 August 2026
      </p>

      <div className="space-y-8 text-gray-700 leading-7">
        <p>
          At <span className="font-semibold">Loopsie</span>, operated by <span className="font-semibold">MALIQ ENTERPRISES</span>, we ensure fast, secure, and hassle-free delivery for all orders. Below are the details regarding our shipping timelines, costs, and processes.
        </p>

        {/* SECTION */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            📦 Order Processing & Dispatch
          </h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <span className="font-medium">Processing Time:</span> Orders are processed within 24-48 hours after payment confirmation.
            </li>
            <li>
              <span className="font-medium">Custom or Personalized Orders:</span> May require an additional 2-3 business days for processing.
            </li>
            <li>
              Orders placed on weekends or public holidays will be processed on the next business day.
            </li>
          </ul>
        </div>

        {/* SECTION */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            🚚 Shipping Timelines & Delivery Estimates
          </h2>
          <p className="mb-3">
            We partner with trusted courier services to ensure fast and reliable shipping across India.
          </p>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-2.5 font-semibold text-gray-800">Region</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-800">Estimated Delivery Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-2.5">Metro Cities (Delhi, Mumbai, Bangalore, etc.)</td>
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
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
            <span className="font-medium">💡 Note:</span> Currently, we do not ship to Jammu & Kashmir and Northeast India due to logistical constraints. We hope to expand to these regions soon.
          </div>
          <p className="mt-3 text-sm text-gray-500">
            Delivery times may vary due to unforeseen delays such as weather conditions, courier issues, or high demand.
          </p>
        </div>

        {/* SECTION */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            💰 Shipping Charges
          </h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <span className="font-medium text-green-600">Free Shipping</span> on orders above or equal to ₹499.
            </li>
            <li>
              For orders below ₹499, a flat shipping fee of <span className="font-medium">₹49</span> applies.
            </li>
            <li>
              <span className="font-medium text-amber-700">Cash on Delivery (COD)</span> has no extra COD fee. Only the applicable delivery charge is added.
            </li>
          </ul>
        </div>

        {/* SECTION */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            🛒 Cash on Delivery (COD) Order Confirmation
          </h2>
          <p>
            Please note that we process COD orders <span className="font-semibold">only after verification and confirmation</span> from the customer via phone call or WhatsApp. If we are unable to reach you or receive confirmation within 24 hours, your order may be cancelled.
          </p>
        </div>

        {/* SECTION */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            🌍 International Shipping
          </h2>
          <p>
            We currently do not ship internationally, but we plan to expand our services soon. Stay tuned!
          </p>
        </div>

        {/* SECTION */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            📦 Order Tracking
          </h2>
          <p>
            Once your order is shipped, you will receive an email and SMS with a tracking link. You can also track your order anytime directly on our website under Order Status.
          </p>
        </div>

        {/* SECTION */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            🛑 Shipping Restrictions & Important Notes
          </h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>COD is available only for orders up to ₹2000.</li>
            <li>
              If a package is undelivered due to incorrect address or refusal to accept, we reserve the right to charge a re-shipping fee.
            </li>
            <li>
              During sales, festive seasons, or peak periods, processing and delivery times may be longer than usual.
            </li>
          </ul>
        </div>

        {/* SECTION */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            📩 Need Help?
          </h2>
          <p>
            For any shipping-related questions or concerns, please contact us at:
          </p>
          <div className="mt-2 space-y-1">
            <p>
              📧{" "}
              <a href="mailto:support@itsloopsie.com" className="text-pink-600 hover:underline">
                support@itsloopsie.com
              </a>
            </p>
            <p>
              📞 Phone: <span className="font-semibold text-gray-900">96675549765</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
