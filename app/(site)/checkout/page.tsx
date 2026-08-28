"use client";
import { useAuthStore } from "@/store/store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import axios, { AxiosError } from "axios";
import { VscLoading } from "react-icons/vsc";
import { loadStripe } from "@stripe/stripe-js";
import { MdOutlinePayment } from "react-icons/md";
import { IoCashOutline } from "react-icons/io5";
import { TbTruckDelivery } from "react-icons/tb";
import { Check } from "lucide-react";
import {
  DELIVERY_CHARGE,
  FIRST_ORDER_DISCOUNT_RATE,
  INDIAN_STATES,
  OrderFieldErrors,
  validateOrderInput,
} from "@/lib/orderValidation";
import { isProductInStock } from "@/lib/productStock";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-sm font-medium text-gray-800">
      {children}
      <span className="ml-0.5 text-red-500">*</span>
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

function inputClass(hasError: boolean) {
  return `w-full rounded border px-3 py-2 outline-none transition focus:ring-2 ${
    hasError
      ? "border-red-400 focus:border-red-400 focus:ring-red-100"
      : "border-gray-300 focus:border-pink-400 focus:ring-pink-100"
  }`;
}

export default function CheckoutPage() {
  const { user, userCart, fetchUser } = useAuthStore();
  const router = useRouter();

  const [recipientName, setRecipientName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [landmark, setLandmark] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [zip, setZip] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMode, setPaymentMode] = useState<"cod" | "online">("cod");
  const [promoCode, setPromoCode] = useState("");
  const [fieldErrors, setFieldErrors] = useState<OrderFieldErrors>({});
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [promoCodeError, setPromoCodeError] = useState("");
  const [promoCodeLoading, setPromoCodeLoading] = useState(false);
  const [finalAmount, setFinalAmount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      setRecipientName(user.name || "");
      setEmail(user.email || "");
      setAddress(user.address || "");
      setCity(user.city || "");
      setState(user.state || "");
      setLandmark(user.landmark || "");
      setZip(user.zip ? String(user.zip) : "");
      setPhone(user.phone ? String(user.phone) : "");
    }
  }, [user]);

  useEffect(() => {
    if (user === null) router.push("/login");
  }, [user]);

  useEffect(() => {
    if (!userCart) return;
    const available = userCart.products.filter((item) =>
      isProductInStock(item.productId),
    );
    if (available.length === 0) {
      router.push("/cart");
    }
  }, [userCart]);

  const availableCartItems =
    userCart?.products.filter((item) => isProductInStock(item.productId)) ?? [];

  const subtotal = availableCartItems.reduce(
    (acc, item) => acc + item.productId.discountedPrice * item.quantity,
    0,
  );

  const firstTimeDiscount = user?.firstPurchase
    ? 0
    : (subtotal + DELIVERY_CHARGE) * FIRST_ORDER_DISCOUNT_RATE;
  const baseTotal = subtotal + DELIVERY_CHARGE - firstTimeDiscount;

  useEffect(() => {
    setFinalAmount(baseTotal);
  }, [subtotal, user?.firstPurchase]);

  const buildOrderPayload = () => ({
    totalAmount: finalAmount,
    paymentMethod: paymentMode,
    deliveryType: "normal" as const,
    recipientName,
    email,
    address,
    city,
    state,
    landmark,
    orderNotes,
    zip,
    phone,
    couponCode: couponApplied ? promoCode : undefined,
    products:
      availableCartItems.map((item) => ({
        productId: item.productId._id,
        quantity: item.quantity,
        size: item.size || "",
        title: item.productId.title,
        price: item.productId.discountedPrice,
        image: item.productId.image,
      })) ?? [],
  });

  const clearFieldError = (field: keyof OrderFieldErrors) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateCheckout = () => {
    setSubmitted(true);
    const result = validateOrderInput(buildOrderPayload());
    setFieldErrors(result.fieldErrors);

    if (!result.valid) {
      const firstField = document.querySelector("[data-invalid='true']");
      firstField?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }

    setOrderError("");
    return true;
  };

  const placeOrder = async () => {
    if (!validateCheckout()) return;

    setPlacingOrder(true);
    try {
      const response = await axios.post("/api/order", {
        ...buildOrderPayload(),
        paymentMethod: "cod",
      });

      useAuthStore.setState({ userCart: null });
      router.push(`/success/${response.data.order._id}`);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const msg =
          error.response?.data?.message ||
          error.response?.data?.errors?.[0] ||
          "Failed to place order.";
        setOrderError(msg);
      }
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleOrder = () => {
    setOrderError("");
    if (paymentMode === "cod") {
      placeOrder();
    } else {
      placeOnlineOrder();
    }
  };

  const placeOnlineOrder = async () => {
    if (!validateCheckout()) return;

    setPlacingOrder(true);
    try {
      const stripe = await stripePromise;
      const response = await axios.post("/api/create-payment-intent", {
        amount: finalAmount * 100,
        _id: user?._id,
        phone,
        productName: "ShopBasics - Thankyou for shopping with us!",
        totalAmount: finalAmount,
        paymentMethod: "online",
        address,
        zip,
      });
      const { id } = response.data;
      await stripe?.redirectToCheckout({ sessionId: id });
    } catch {
      setOrderError("Something went wrong. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  const applyCoupon = async () => {
    if (couponApplied) {
      setPromoCodeError("Coupon already applied.");
      return;
    }
    if (!promoCode) {
      setPromoCodeError("Please enter a valid coupon code.");
      return;
    }
    if (!availableCartItems.length || !baseTotal) {
      setPromoCodeError("Your cart is empty.");
      return;
    }

    setPromoCodeLoading(true);
    try {
      const response = await axios.post("/api/coupon/apply", {
        code: promoCode,
        totalAmount: baseTotal,
      });
      setFinalAmount(response.data.finalAmount);
      setPromoCodeError(response.data.message || "Coupon applied!");
      setCouponApplied(true);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setPromoCodeError(error.response?.data.message);
      }
    } finally {
      setPromoCodeLoading(false);
    }
  };

  const showError = (field: keyof OrderFieldErrors) =>
    submitted ? fieldErrors[field] : undefined;

  return (
    <div className="min-h-[80vh] p-4">
      <div className="mb-4 text-sm text-gray-500">
        <span
          className="cursor-pointer hover:text-pink-600"
          onClick={() => router.push("/")}
        >
          Home
        </span>{" "}
        / <span className="text-black">Checkout</span>
      </div>

      <h1 className="mb-6 text-3xl font-bold">Checkout</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="rounded-xl border border-rose-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-rose-950">
              Delivery Details
            </h2>

            <div className="space-y-4">
              <div
                data-invalid={showError("recipientName") ? "true" : undefined}
              >
                <RequiredLabel>Full name</RequiredLabel>
                <input
                  value={recipientName}
                  onChange={(e) => {
                    setRecipientName(e.target.value);
                    clearFieldError("recipientName");
                  }}
                  placeholder="Recipient full name"
                  className={inputClass(!!showError("recipientName"))}
                />
                <FieldError message={showError("recipientName")} />
              </div>

              <div data-invalid={showError("email") ? "true" : undefined}>
                <label className="mb-1 block text-sm font-medium text-gray-800">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError("email");
                  }}
                  placeholder="you@example.com"
                  className={inputClass(!!showError("email"))}
                />
                <FieldError message={showError("email")} />
              </div>

              <div data-invalid={showError("address") ? "true" : undefined}>
                <RequiredLabel>
                  Address (please enter proper address ){" "}
                </RequiredLabel>
                <textarea
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    clearFieldError("address");
                  }}
                  placeholder="House no., street, area"
                  rows={3}
                  className={inputClass(!!showError("address"))}
                />
                <FieldError message={showError("address")} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div data-invalid={showError("city") ? "true" : undefined}>
                  <RequiredLabel>City</RequiredLabel>
                  <input
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      clearFieldError("city");
                    }}
                    placeholder="City"
                    className={inputClass(!!showError("city"))}
                  />
                  <FieldError message={showError("city")} />
                </div>

                <div data-invalid={showError("state") ? "true" : undefined}>
                  <RequiredLabel>State</RequiredLabel>
                  <select
                    value={state}
                    onChange={(e) => {
                      setState(e.target.value);
                      clearFieldError("state");
                    }}
                    className={inputClass(!!showError("state"))}
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <FieldError message={showError("state")} />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-800">
                  Landmark
                </label>
                <input
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="Near school, mall, etc. (optional)"
                  className={inputClass(false)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div data-invalid={showError("zip") ? "true" : undefined}>
                  <RequiredLabel>Pincode</RequiredLabel>
                  <input
                    value={zip}
                    onChange={(e) => {
                      setZip(e.target.value.replace(/\D/g, "").slice(0, 6));
                      clearFieldError("zip");
                    }}
                    placeholder="6-digit pincode"
                    className={inputClass(!!showError("zip"))}
                  />
                  <FieldError message={showError("zip")} />
                </div>

                <div data-invalid={showError("phone") ? "true" : undefined}>
                  <RequiredLabel>Phone</RequiredLabel>
                  <input
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                      clearFieldError("phone");
                    }}
                    placeholder="10-digit mobile"
                    className={inputClass(!!showError("phone"))}
                  />
                  <FieldError message={showError("phone")} />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-800">
                  Order notes
                </label>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value.slice(0, 500))}
                  placeholder="Delivery instructions, gift wrap, etc. (optional)"
                  rows={2}
                  className={inputClass(false)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-rose-100 bg-white p-5 text-sm shadow-sm">
            <h2 className="text-lg font-bold text-rose-950">Order Summary</h2>
            <hr className="my-3 border-gray-200" />
            <div className="space-y-2">
              <div className="flex justify-between">
                <p className="text-gray-600">
                  Items ({availableCartItems.length})
                </p>
                <p>₹{subtotal.toFixed(2)}</p>
              </div>
              <div className="flex justify-between">
                <p className="flex items-center gap-1.5 text-gray-600">
                  <TbTruckDelivery className="size-4" />
                  Delivery charge
                </p>
                <p>₹{DELIVERY_CHARGE.toFixed(2)}</p>
              </div>
              {!user?.firstPurchase && (
                <div className="flex justify-between text-green-600">
                  <p>First order discount (15%)</p>
                  <p>-₹{firstTimeDiscount.toFixed(2)}</p>
                </div>
              )}
            </div>
            <div className="mt-3 flex justify-between border-t border-gray-100 pt-3 text-base font-bold">
              <p>Total</p>
              <p className="text-rose-700">₹{finalAmount.toFixed(2)}</p>
            </div>

            {showError("products") && (
              <FieldError message={showError("products")} />
            )}
          </div>

          <div className="rounded-xl border border-rose-100 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-800">
              How would you like to pay?
            </h2>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setPaymentMode("cod")}
                className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition ${
                  paymentMode === "cod"
                    ? "border-rose-500 bg-rose-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-rose-200 hover:bg-rose-50/40"
                }`}
              >
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-full ${
                    paymentMode === "cod"
                      ? "bg-rose-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <IoCashOutline className="size-5" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-gray-900">
                    Cash on Delivery
                  </span>
                  <span className="block text-xs text-gray-500">
                    Pay when your order arrives
                  </span>
                </span>
                {paymentMode === "cod" && (
                  <Check className="size-5 shrink-0 text-rose-600" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode("online")}
                className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition ${
                  paymentMode === "online"
                    ? "border-rose-500 bg-rose-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-rose-200 hover:bg-rose-50/40"
                }`}
              >
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-full ${
                    paymentMode === "online"
                      ? "bg-rose-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <MdOutlinePayment className="size-5" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-gray-900">
                    Online Payment
                  </span>
                  <span className="block text-xs text-gray-500">
                    UPI, card, or net banking
                  </span>
                </span>
                {paymentMode === "online" && (
                  <Check className="size-5 shrink-0 text-rose-600" />
                )}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-rose-100 bg-white p-5 shadow-sm">
            <label htmlFor="promo" className="text-sm font-medium">
              Promo code
            </label>
            <div className="mt-2 flex">
              <input
                id="promo"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Enter code"
                className="w-full rounded-l-lg border border-gray-200 px-3 py-2 text-sm"
                disabled={couponApplied}
              />
              <Button
                disabled={promoCodeLoading || couponApplied}
                onClick={applyCoupon}
                className="cursor-pointer rounded-l-none rounded-r-lg bg-rose-600 text-white hover:bg-rose-700"
              >
                {promoCodeLoading ? (
                  <VscLoading className="animate-spin text-xl" />
                ) : couponApplied ? (
                  "Applied"
                ) : (
                  "Apply"
                )}
              </Button>
            </div>
            {promoCodeError && (
              <p className="mt-2 text-xs text-red-500">{promoCodeError}</p>
            )}
          </div>

          {orderError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {orderError}
            </p>
          )}

          <Button
            disabled={placingOrder}
            className="w-full cursor-pointer rounded-xl bg-rose-600 py-6 text-base font-semibold text-white shadow-md hover:bg-rose-700"
            onClick={handleOrder}
          >
            {placingOrder ? (
              <VscLoading className="animate-spin text-xl" />
            ) : paymentMode === "cod" ? (
              `Place Order · ₹${finalAmount.toFixed(2)}`
            ) : (
              `Pay Online · ₹${finalAmount.toFixed(2)}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
