import { FaTruck } from "react-icons/fa";
import { Sparkles } from "lucide-react";

export default function FreeShippingBar({
  isFreeShipping = true,
  remainingForFreeShipping = 0,
  subtotal = 0,
  freeShippingProgress = 100,
}: {
  isFreeShipping?: boolean;
  remainingForFreeShipping?: number;
  subtotal?: number;
  freeShippingProgress?: number;
} = {}) {
  return (
    <div className="p-4 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-emerald-50/90 shadow-xs flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm shrink-0">
          <FaTruck className="size-4" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-950">
            <span>Free Delivery On This Order</span>
            <Sparkles className="size-3.5 text-emerald-600 animate-pulse" />
          </div>
          <p className="text-xs text-emerald-700/90 font-medium">
            100% Free delivery across India · No minimum purchase needed
          </p>
        </div>
      </div>

      <span className="shrink-0 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-xs">
        FREE
      </span>
    </div>
  );
}

