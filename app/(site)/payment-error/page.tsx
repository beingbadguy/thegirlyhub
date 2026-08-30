// app/payment-failed/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { XCircle, RefreshCw, ArrowLeft } from "lucide-react";

export default function PaymentFailed() {
  const router = useRouter();

  return (
    <div className="min-h-[70vh] bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Main Error Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gray-100 rounded-full">
              <XCircle className="w-16 h-16 text-gray-600" />
            </div>
          </div>

          {/* Error Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Payment Failed
          </h1>

          {/* Error Description */}
          <p className="text-gray-600 text-sm leading-relaxed mb-8">
            {`We couldn't process your payment. This could be due to insufficient funds, network issues, or the payment was cancelled. Please try again.`}
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => router.push("/cart")}
              className="w-full bg-black hover:bg-gray-800 text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>

            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Continue Shopping
            </Button>
          </div>
        </div>

        {/* Help Section */}
        {/* <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Common Solutions
          </h3>

          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></div>
              <p>Check your card details and try again</p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></div>
              <p>Try using a different payment method</p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></div>
              <p>Contact your bank if the issue persists</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              Need help? Contact support at{" "}
              <a
                href="mailto:officialgirlyhub@gmail.com"
                className="text-black hover:underline font-medium"
              >
                officialgirlyhub@gmail.com
              </a>
            </p>
          </div>
        </div> */}

        {/* Security Notice */}
        {/* <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            🔒 Your payment information is secure and protected
          </p>
        </div> */}
      </div>
    </div>
  );
}
