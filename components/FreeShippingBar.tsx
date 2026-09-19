import { FaTruck, FaCheckCircle } from "react-icons/fa";
import { BsLightningFill } from "react-icons/bs";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_CHARGE } from "@/lib/shipping";

export default function FreeShippingBar({
  isFreeShipping,
  remainingForFreeShipping,
  subtotal,
  freeShippingProgress,
}: {
  isFreeShipping: boolean;
  remainingForFreeShipping: number;
  subtotal: number;
  freeShippingProgress: number;
}) {
  return (
    <div className="p-4 rounded-xl border bg-white shadow-sm space-y-3">
      {/* Top Row */}
      <div className="flex items-center justify-between text-sm font-medium">
        {/* Left Content */}
        <div className="flex items-center gap-2">
          {isFreeShipping ? (
            <>
              <FaCheckCircle className="text-green-500 text-base" />
              <span className="text-green-600">Free shipping unlocked</span>
            </>
          ) : (
            <>
              <FaTruck className="text-rose-500 text-base" />
              <span className="text-gray-700">
                Add{" "}
                <span className="font-semibold text-rose-600">
                  ₹{remainingForFreeShipping}
                </span>{" "}
                more for free delivery
              </span>
            </>
          )}
        </div>

        {/* Right Price */}
        <span className="text-gray-500 font-semibold">₹{subtotal} / ₹{FREE_SHIPPING_THRESHOLD}</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-700 ease-out ${
            isFreeShipping ? "bg-green-500" : "bg-rose-500"
          }`}
          style={{ width: `${freeShippingProgress}%` }}
        />
      </div>

      {/* Bottom Success */}
      {isFreeShipping && (
        <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
          <BsLightningFill className="text-green-500" />
          You saved ₹{SHIPPING_CHARGE} on shipping
        </div>
      )}
    </div>
  );
}
