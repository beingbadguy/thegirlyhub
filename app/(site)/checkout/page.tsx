"use client";
import { useAuthStore } from "@/store/store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import axios, { AxiosError } from "axios";
import { VscLoading } from "react-icons/vsc";
import { MdCancel, MdOutlinePayment } from "react-icons/md";
import { IoCashOutline } from "react-icons/io5";
import { TbTruckDelivery } from "react-icons/tb";
import { Check, ShoppingBag } from "lucide-react";
import BreadcrumbHome from "@/components/BreadcrumbHome";
import {
  FIRST_ORDER_DISCOUNT_RATE,
  INDIAN_STATES,
  OrderFieldErrors,
  validateOrderInput,
} from "@/lib/orderValidation";
import {
  calculateCheckout,
  MIN_PAYABLE_AMOUNT,
} from "@/lib/checkoutCalculation";
import { calculateShipping, SHIPPING_CHARGE } from "@/lib/shipping";
import { isProductInStock } from "@/lib/productStock";
import { clearGuestCart } from "@/lib/guestCart";
import CaptchaWidget from "@/components/CaptchaWidget";
import { executeCaptcha, loadCaptchaScript } from "@/lib/clientCaptcha";
import { productUrl } from "@/lib/slug";
import {
  User,
  Mail,
  MapPin,
  Phone,
  Landmark,
  ClipboardList,
  ShieldCheck,
  X,
} from "lucide-react";
import FloralAccent from "@/components/decorations/FloralAccent";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );
    if (existing) {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

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
  return `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 ${
    hasError
      ? "border-red-400 focus:border-red-400 focus:ring-red-100"
      : "border-gray-200 focus:border-pink-400 focus:ring-pink-100"
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
  const [couponDetails, setCouponDetails] = useState<{
    discount: number;
    type: "percentage" | "flat";
    code: string;
    maxDiscount?: number | null;
    minOrderAmount?: number | null;
  } | null>(null);

  const welcomeCouponCode = "NEWGIRLY";
  const eligibleForWelcomeCoupon = !user || !user.firstPurchase;
  const [welcomeCouponRedeemed, setWelcomeCouponRedeemed] = useState(false);

  const couponApplied = !!couponDetails;
  const [captchaToken, setCaptchaToken] = useState("");
  const [showCodModal, setShowCodModal] = useState(false);
  const [codModalError, setCodModalError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isCheckingCart, setIsCheckingCart] = useState(true);
  const [orderCompleted, setOrderCompleted] = useState(false);

  useEffect(() => {
    document.title = "Checkout | GirlyHub";
    loadRazorpayScript().catch(() => {});
    loadCaptchaScript().catch(() => {});
    let isMounted = true;
    useAuthStore
      .getState()
      .fetchUser()
      .finally(() => {
        if (isMounted) {
          setIsCheckingCart(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (user) {
      if (user.name) setRecipientName((prev) => prev || user.name || "");
      if (user.email) setEmail((prev) => prev || user.email || "");
      if (user.address) setAddress((prev) => prev || user.address || "");
      if (user.city) setCity((prev) => prev || user.city || "");
      if (user.state) setState((prev) => prev || user.state || "");
      if (user.landmark) setLandmark((prev) => prev || user.landmark || "");
      if (user.zip) setZip((prev) => prev || String(user.zip));
      if (user.phone) setPhone((prev) => prev || String(user.phone));
    }
  }, [user]);

  useEffect(() => {
    if (eligibleForWelcomeCoupon && !couponApplied && !welcomeCouponRedeemed) {
      setPromoCode(welcomeCouponCode);
    }
  }, [eligibleForWelcomeCoupon, couponApplied, welcomeCouponRedeemed]);

  const availableCartItems =
    userCart?.products?.filter(
      (item) => item?.productId && isProductInStock(item.productId),
    ) ?? [];

  useEffect(() => {
    if (isCheckingCart || placingOrder || orderCompleted) return;
    if (availableCartItems.length === 0) {
      router.replace("/cart");
    }
  }, [
    isCheckingCart,
    placingOrder,
    orderCompleted,
    availableCartItems.length,
    router,
  ]);

  const mappedCartItems = availableCartItems.map((item) => {
    const p = item.productId;
    const price = Number(
      p.discountedPrice ||
        p.price ||
        (p as any).sellingPrice ||
        (p as any).discountPrice ||
        0,
    );
    return {
      productId: p._id,
      quantity: item.quantity,
      price,
      title: p.title || (p as any).name || "Product",
      image: p.image || (p as any).mainImage || "",
      size: item.size || "",
    };
  });

  const calcResult = calculateCheckout({
    items: mappedCartItems,
    isFirstOrder: !user?.firstPurchase,
    coupon: couponDetails
      ? {
          code: couponDetails.code,
          discount: couponDetails.discount,
          type: couponDetails.type,
          maxDiscount: couponDetails.maxDiscount,
          minOrderAmount: couponDetails.minOrderAmount,
        }
      : null,
    paymentMethod: paymentMode,
    autoAdjustDiscount: true,
  });

  const subtotal = calcResult.subtotal;
  const shippingCharge = calcResult.shippingCharge;
  const isFreeShipping = calcResult.isFreeShipping;
  const firstTimeDiscount = calcResult.firstOrderDiscount;
  const couponDiscount = calcResult.couponDiscount;
  const finalAmount = calcResult.finalAmount;
  const isCouponAdjusted = calcResult.couponDiscountAdjusted;

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
      availableCartItems.map((item) => {
        const p = item.productId;
        const price = Number(
          p.discountedPrice ||
            p.price ||
            (p as any).sellingPrice ||
            (p as any).discountPrice ||
            0,
        );
        return {
          productId: p._id,
          quantity: item.quantity,
          size: item.size || "",
          title: p.title || (p as any).name || "Product",
          price: price,
          image: p.image || (p as any).mainImage || "",
        };
      }) ?? [],
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

  const confirmCodOrder = async (overrideToken?: string) => {
    if (availableCartItems.length === 0) {
      router.replace("/cart");
      return;
    }

    const token =
      overrideToken || captchaToken || (await executeCaptcha("cod_checkout"));

    if (!token) {
      setCodModalError("Please complete the security check before placing your order.");
      return;
    }

    setPlacingOrder(true);
    setCodModalError("");
    setOrderError("");

    try {
      const response = await axios.post("/api/order", {
        ...buildOrderPayload(),
        captchaToken: token,
      });

      setOrderCompleted(true);
      setShowCodModal(false);
      clearGuestCart();
      useAuthStore.setState((prevStore) => {
        if (!prevStore.user) return { userCart: { products: [] } };
        return {
          userCart: { products: [] },
          user: {
            ...prevStore.user,
            name: recipientName || prevStore.user.name,
            address: address || prevStore.user.address,
            city: city || prevStore.user.city,
            state: state || prevStore.user.state,
            landmark: landmark || prevStore.user.landmark,
            zip: Number(zip) || prevStore.user.zip,
            phone: Number(phone) || prevStore.user.phone,
          },
        };
      });
      router.push(`/success/${response.data.order._id}`);
    } catch (error: unknown) {
      setOrderCompleted(false);
      if (error instanceof AxiosError) {
        const msg =
          error.response?.data?.message ||
          error.response?.data?.errors?.[0] ||
          "Failed to place order.";
        setCodModalError(msg);
        setOrderError(msg);
      } else {
        setCodModalError("Failed to place order. Please try again.");
      }
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleOrder = () => {
    setOrderError("");
    if (paymentMode === "cod") {
      if (availableCartItems.length === 0) {
        router.replace("/cart");
        return;
      }
      if (!validateCheckout()) return;
      setCodModalError("");
      setShowCodModal(true);
    } else {
      placeOnlineOrder();
    }
  };

  const placeOnlineOrder = async () => {
    if (availableCartItems.length === 0) {
      router.replace("/cart");
      return;
    }
    if (!validateCheckout()) return;

    setPlacingOrder(true);
    try {
      const res = await loadRazorpayScript();
      if (!res) {
        setOrderError("Razorpay SDK failed to load. Are you online?");
        setPlacingOrder(false);
        return;
      }

      // Create Razorpay order via our backend with full order payload
      const orderRes = await axios.post(
        "/api/create-order",
        buildOrderPayload(),
      );

      const { order_id, amount, currency, key } = orderRes.data;
      const razorpayKey = key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!razorpayKey) {
        setOrderError("Razorpay key is missing. Please contact support.");
        setPlacingOrder(false);
        return;
      }

      const options = {
        key: razorpayKey,
        amount,
        currency: currency || "INR",
        name: "GirlyHub",
        description: "Thank you for shopping with us!",
        order_id,
        handler: async function (response: any) {
          try {
            setPlacingOrder(true); // Keep loading state true during verification
            const verifyRes = await axios.post("/api/verify-payment", {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data.success) {
              setOrderCompleted(true);
              clearGuestCart();
              useAuthStore.setState((prevStore) => {
                if (!prevStore.user) return { userCart: { products: [] } };
                return {
                  userCart: { products: [] },
                  user: {
                    ...prevStore.user,
                    name: recipientName || prevStore.user.name,
                    address: address || prevStore.user.address,
                    city: city || prevStore.user.city,
                    state: state || prevStore.user.state,
                    landmark: landmark || prevStore.user.landmark,
                    zip: Number(zip) || prevStore.user.zip,
                    phone: Number(phone) || prevStore.user.phone,
                  },
                };
              });
              const successId =
                verifyRes.data.orderId || response.razorpay_payment_id;
              router.push(`/online-success/${successId}`);
            } else {
              setOrderCompleted(false);
              setOrderError(
                verifyRes.data.message || "Payment verification failed.",
              );
            }
          } catch (error) {
            console.error("Verification error", error);
            setOrderCompleted(false);
            setOrderError(
              "Payment verification failed. Please contact support.",
            );
          } finally {
            setPlacingOrder(false);
          }
        },
        prefill: {
          name: recipientName,
          email: email,
          contact: phone,
        },
        theme: {
          color: "#e11d48", // rose-600
        },
        modal: {
          ondismiss: function () {
            setOrderError(
              "Payment was cancelled. You can try again when ready.",
            );
            setPlacingOrder(false);
          },
        },
      };

      try {
        const paymentObject = new window.Razorpay(options);
        paymentObject.on("payment.failed", function (response: any) {
          setOrderError(
            "Payment failed: " +
              (response.error?.description || "Payment was rejected."),
          );
          setPlacingOrder(false);
        });
        paymentObject.open();
      } catch (sdkErr: any) {
        console.error("Razorpay open error:", sdkErr);
        setOrderError("Could not launch payment window. Please try again.");
        setPlacingOrder(false);
      }
    } catch (error: any) {
      console.error(error);
      const msg =
        error.response?.data?.message ||
        "Something went wrong initializing payment. Please try again.";
      setOrderError(msg);
      setPlacingOrder(false);
    }
  };

  const applyCoupon = async () => {
    if (couponApplied) {
      setPromoCodeError("Coupon already applied.");
      return;
    }
    const cleanCode = promoCode.trim();
    if (!cleanCode) {
      setPromoCodeError("Please enter a valid coupon code.");
      return;
    }
    if (!availableCartItems.length || subtotal <= 0) {
      setPromoCodeError("Your cart is empty.");
      return;
    }

    setPromoCodeLoading(true);
    setPromoCodeError("");
    try {
      const response = await axios.post("/api/coupon/apply", {
        code: cleanCode,
        totalAmount: subtotal,
        email,
      });
      setCouponDetails({
        code: response.data.code || cleanCode,
        discount: response.data.discountValue,
        type: response.data.couponType,
      });
      setPromoCode(response.data.code || cleanCode);
      setPromoCodeError(
        response.data.message || (response.data.discountAdjusted ? "Coupon applied with adjusted discount to maintain minimum ₹1.00 order total." : "Coupon applied successfully!"),
      );
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setPromoCodeError(
          error.response?.data?.message || "Invalid coupon code.",
        );
      } else {
        setPromoCodeError("Failed to apply coupon. Please try again.");
      }
      setCouponDetails(null);
    } finally {
      setPromoCodeLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponDetails(null);
    setPromoCode("");
    setPromoCodeError("");
    setWelcomeCouponRedeemed(false);
  };

  const redeemWelcomeCoupon = async () => {
    setPromoCode(welcomeCouponCode);
    setPromoCodeError("");
    setPromoCodeLoading(true);
    try {
      const response = await axios.post("/api/coupon/apply", {
        code: welcomeCouponCode,
        totalAmount: subtotal,
        email,
      });
      setCouponDetails({
        code: response.data.code || welcomeCouponCode,
        discount: response.data.discountValue,
        type: response.data.couponType,
      });
      setWelcomeCouponRedeemed(true);
      setPromoCodeError(
        response.data.message || (response.data.discountAdjusted ? "Welcome coupon applied (discount adjusted to maintain minimum ₹1.00 total)." : "Welcome coupon applied successfully!"),
      );
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setPromoCodeError(
          error.response?.data?.message || "Unable to redeem this coupon.",
        );
      } else {
        setPromoCodeError("Failed to redeem welcome coupon.");
      }
      setCouponDetails(null);
      setWelcomeCouponRedeemed(false);
    } finally {
      setPromoCodeLoading(false);
    }
  };

  const showError = (field: keyof OrderFieldErrors) =>
    submitted ? fieldErrors[field] : undefined;

  if (isCheckingCart) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[#fffafb] px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="size-10 animate-spin rounded-full border-4 border-rose-200 border-t-rose-600" />
          <p className="text-sm font-medium text-gray-600">
            Checking your cart...
          </p>
        </div>
      </div>
    );
  }

  if (availableCartItems.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[#fffafb] px-4">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <ShoppingBag className="size-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Your Cart is Empty
          </h2>
          <p className="text-sm text-gray-600">
            You don&apos;t have any items in your checkout. Redirecting you to
            your cart...
          </p>
          <Button
            onClick={() => router.replace("/cart")}
            className="mt-2 bg-rose-600 hover:bg-rose-700 text-white"
          >
            Go to Cart
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-[#fffafb]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex items-center gap-2 text-xs md:text-sm text-neutral-500"
        >
          <BreadcrumbHome />
          <span className="text-neutral-300">/</span>
          <span className="font-semibold text-neutral-900">Checkout</span>
        </nav>

        <div className="mb-6 flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-950 font-serif">Checkout</h1>
            <FloralAccent flower={1} size="xs" variant="pulse" className="opacity-80" />
          </div>
          <p className="text-sm text-gray-500">
            Review your delivery details and order items before placing the
            order.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px] xl:gap-8">
          <div>
            <div className="rounded-xl border border-rose-100 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
              <h2 className="mb-4 text-lg font-semibold text-rose-950">
                Delivery Details
              </h2>

              <div className="space-y-4">
                {/* Name */}
                <div
                  data-invalid={showError("recipientName") ? "true" : undefined}
                >
                  <RequiredLabel>Full name</RequiredLabel>

                  <div className="flex items-center gap-3 rounded-lg border px-3 py-2 focus-within:ring-2 focus-within:ring-pink-100 focus-within:border-pink-400">
                    <User className="h-4 w-4 text-gray-400" />
                    <input
                      autoComplete="name"
                      value={recipientName}
                      onChange={(e) => {
                        setRecipientName(e.target.value);
                        clearFieldError("recipientName");
                      }}
                      placeholder="Recipient full name"
                      className="w-full bg-transparent outline-none text-sm"
                    />
                  </div>

                  <FieldError message={showError("recipientName")} />
                </div>

                {/* Email */}
                <div data-invalid={showError("email") ? "true" : undefined}>
                  <RequiredLabel>Email</RequiredLabel>

                  <div className="flex items-center gap-3 rounded-lg border px-3 py-2 focus-within:ring-2 focus-within:ring-pink-100 focus-within:border-pink-400">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearFieldError("email");
                      }}
                      placeholder="you@example.com"
                      className="w-full bg-transparent outline-none text-sm"
                    />
                  </div>

                  <FieldError message={showError("email")} />
                </div>

                {/* Address */}
                <div data-invalid={showError("address") ? "true" : undefined}>
                  <RequiredLabel>Address</RequiredLabel>

                  <div className="flex items-start gap-3 rounded-lg border px-3 py-2 focus-within:ring-2 focus-within:ring-pink-100 focus-within:border-pink-400">
                    <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                    <textarea
                      autoComplete="street-address"
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        clearFieldError("address");
                      }}
                      rows={3}
                      placeholder="House no., street, area"
                      className="w-full bg-transparent outline-none text-sm resize-none"
                    />
                  </div>

                  <FieldError message={showError("address")} />
                </div>

                {/* City + State */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div data-invalid={showError("city") ? "true" : undefined}>
                    <RequiredLabel>City</RequiredLabel>

                    <div className="flex items-center gap-3 rounded-lg border px-3 py-2 focus-within:ring-2 focus-within:ring-pink-100 focus-within:border-pink-400">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <input
                        autoComplete="address-level2"
                        value={city}
                        onChange={(e) => {
                          setCity(e.target.value);
                          clearFieldError("city");
                        }}
                        placeholder="City"
                        className="w-full bg-transparent outline-none text-sm"
                      />
                    </div>

                    <FieldError message={showError("city")} />
                  </div>

                  <div data-invalid={showError("state") ? "true" : undefined}>
                    <RequiredLabel>State</RequiredLabel>

                    <div className="flex items-center gap-3 rounded-lg border px-3 py-2 focus-within:ring-2 focus-within:ring-pink-100 focus-within:border-pink-400">
                      <select
                        autoComplete="address-level1"
                        value={state}
                        onChange={(e) => {
                          setState(e.target.value);
                          clearFieldError("state");
                        }}
                        className="w-full bg-transparent outline-none text-sm"
                      >
                        <option value="">Select state</option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <FieldError message={showError("state")} />
                  </div>
                </div>

                {/* Landmark */}
                <div>
                  <RequiredLabel>Landmark</RequiredLabel>

                  <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
                    <Landmark className="h-4 w-4 text-gray-400" />
                    <input
                      autoComplete="address-line2"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="Near school, mall, etc. (optional)"
                      className="w-full bg-transparent outline-none text-sm"
                    />
                  </div>
                </div>

                {/* Zip + Phone */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div data-invalid={showError("zip") ? "true" : undefined}>
                    <RequiredLabel>Pincode</RequiredLabel>

                    <div className="flex items-center gap-3 rounded-lg border px-3 py-2 focus-within:ring-2 focus-within:ring-pink-100 focus-within:border-pink-400">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <input
                        inputMode="numeric"
                        autoComplete="postal-code"
                        value={zip}
                        onChange={(e) => {
                          setZip(e.target.value.replace(/\D/g, "").slice(0, 6));
                          clearFieldError("zip");
                        }}
                        placeholder="6-digit pincode"
                        className="w-full bg-transparent outline-none text-sm"
                      />
                    </div>

                    <FieldError message={showError("zip")} />
                  </div>

                  <div data-invalid={showError("phone") ? "true" : undefined}>
                    <RequiredLabel>Phone</RequiredLabel>

                    <div className="flex items-center rounded-lg border overflow-hidden focus-within:ring-2 focus-within:ring-pink-100 focus-within:border-pink-400">
                      <span className="bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                        +91
                      </span>
                      <Phone className="h-4 w-4 text-gray-400 ml-2" />
                      <input
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        value={phone}
                        onChange={(e) => {
                          setPhone(
                            e.target.value.replace(/\D/g, "").slice(0, 10),
                          );
                          clearFieldError("phone");
                        }}
                        placeholder="10-digit mobile number"
                        className="w-full px-2 py-2 outline-none text-sm"
                      />
                    </div>

                    <p className="mt-1 text-[11px] text-gray-400">
                      We&apos;ll use this number for delivery updates.
                    </p>

                    <FieldError message={showError("phone")} />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <RequiredLabel>Order notes</RequiredLabel>

                  <div className="flex items-start gap-3 rounded-lg border px-3 py-2">
                    <ClipboardList className="h-4 w-4 text-gray-400 mt-1" />
                    <textarea
                      maxLength={500}
                      value={orderNotes}
                      onChange={(e) =>
                        setOrderNotes(e.target.value.slice(0, 500))
                      }
                      placeholder="Delivery instructions, gift wrap, etc. (optional)"
                      rows={2}
                      className="w-full bg-transparent outline-none text-sm resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
              <div className="mb-3.5 flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Order Items ({availableCartItems.length})
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Review your items before placing order
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/cart")}
                  className="shrink-0 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md transition"
                >
                  Edit cart
                </button>
              </div>

              <div className="max-h-[320px] space-y-2.5 overflow-y-auto pr-1.5 custom-scrollbar">
                {availableCartItems.map((item) => {
                  const product = item.productId;
                  const unitPrice = Number(
                    product.discountedPrice ||
                      product.price ||
                      (product as any).sellingPrice ||
                      (product as any).discountPrice ||
                      0,
                  );
                  const lineTotal = unitPrice * item.quantity;
                  const itemUrl = productUrl(
                    product.title,
                    product._id,
                    (product as any).slug,
                  );
                  const itemImg =
                    product.image ||
                    (product as any).mainImage ||
                    "/final_gh.png";

                  return (
                    <div
                      key={`${product._id}-${item.size || "default"}`}
                      className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50/40 p-3 hover:bg-gray-50 transition-colors"
                    >
                      <Link
                        href={itemUrl}
                        className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-white border border-gray-100 p-0.5 transition hover:opacity-80"
                      >
                        <Image
                          src={itemImg}
                          alt={product.title || "Product"}
                          fill
                          className="object-contain p-0.5"
                        />
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={itemUrl}
                          className="line-clamp-1 text-xs sm:text-sm font-semibold text-gray-900 transition hover:text-rose-600"
                        >
                          {product.title}
                        </Link>
                        <div className="mt-1 flex items-center gap-2 flex-wrap text-xs text-gray-500">
                          {item.size &&
                            item.size.toLowerCase() !== "one size" && (
                              <span className="bg-gray-200/70 text-gray-700 px-1.5 py-0.5 rounded text-[11px] font-medium">
                                Size: {item.size}
                              </span>
                            )}
                          <span className="bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded text-[11px] font-medium">
                            Qty: {item.quantity}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-xs">
                          <span className="text-gray-500">
                            ₹{unitPrice.toFixed(2)} each
                          </span>
                          <span className="font-bold text-gray-900 text-sm">
                            ₹{lineTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {availableCartItems.length > 3 && (
                <p className="mt-2 text-center text-[11px] text-gray-400">
                  Scroll down to view all {availableCartItems.length} items ↓
                </p>
              )}
            </div>

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
                  {isFreeShipping ? (
                    <p className="text-green-600 font-bold flex items-center gap-1">
                      <span className="line-through text-xs text-gray-400 font-normal">
                        ₹{SHIPPING_CHARGE.toFixed(2)}
                      </span>{" "}
                      FREE
                    </p>
                  ) : (
                    <p>₹{shippingCharge.toFixed(2)}</p>
                  )}
                </div>
                {isFreeShipping && (
                  <div className="text-[11px] text-green-700 font-medium">
                    You saved ₹{SHIPPING_CHARGE} on shipping 🎉
                  </div>
                )}
                {!user?.firstPurchase && (
                  <div className="flex justify-between text-green-600">
                    <p>First order discount (15%)</p>
                    <p>-₹{firstTimeDiscount.toFixed(2)}</p>
                  </div>
                )}
                {couponApplied && (
                  <div className="flex justify-between text-green-600">
                    <div>
                      <p>Coupon discount ({promoCode.toUpperCase()})</p>
                      {isCouponAdjusted && (
                        <span className="text-[10px] text-amber-600 font-medium block">
                          (Adjusted to maintain ₹{MIN_PAYABLE_AMOUNT.toFixed(2)} min order total)
                        </span>
                      )}
                    </div>
                    <p>-₹{couponDiscount.toFixed(2)}</p>
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
              {eligibleForWelcomeCoupon && !couponApplied && (
                <div className="mb-4 flex items-center justify-between gap-4 rounded-lg bg-rose-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-rose-900">
                      Welcome offer: 15% off your first order
                    </p>
                    <p className="mt-1 text-xs text-rose-700/70">
                      Use code {welcomeCouponCode} before you place your order.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={redeemWelcomeCoupon}
                    disabled={promoCodeLoading || !availableCartItems.length}
                    className="shrink-0 rounded-lg bg-rose-600 px-3 text-xs text-white hover:bg-rose-700 cursor-pointer"
                  >
                    {promoCodeLoading ? "Redeeming..." : "Redeem"}
                  </Button>
                </div>
              )}
              <div className="flex items-center justify-between">
                <label
                  htmlFor="promo"
                  className="text-sm font-medium text-gray-800"
                >
                  Promo code
                </label>
                {couponApplied && couponDetails && (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <Check className="size-3.5" />
                    Applied (
                    {couponDetails.type === "percentage"
                      ? `${couponDetails.discount}% off`
                      : `₹${couponDetails.discount} off`}
                    )
                  </span>
                )}
              </div>
              <div className="mt-2 flex">
                <input
                  id="promo"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value);
                    if (promoCodeError && !couponApplied) setPromoCodeError("");
                  }}
                  placeholder="Enter code"
                  className={`w-full rounded-l-lg border px-3.5 py-2 text-sm outline-none transition ${
                    couponApplied
                      ? "border-emerald-300 bg-emerald-50/30 text-emerald-900 font-medium"
                      : "border-gray-200 bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  }`}
                  disabled={couponApplied}
                />
                {couponApplied ? (
                  <Button
                    type="button"
                    onClick={removeCoupon}
                    className="cursor-pointer rounded-l-none rounded-r-lg border border-l-0 border-rose-300 bg-rose-50 px-4 text-xs font-semibold text-rose-700 hover:bg-rose-100 hover:text-rose-800 transition"
                  >
                    <MdCancel className="size-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={promoCodeLoading || !promoCode.trim()}
                    onClick={applyCoupon}
                    className="cursor-pointer rounded-l-none rounded-r-lg bg-rose-600 px-4 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50 transition"
                  >
                    {promoCodeLoading ? (
                      <VscLoading className="animate-spin text-lg" />
                    ) : (
                      "Apply"
                    )}
                  </Button>
                )}
              </div>
              {promoCodeError && (
                <p
                  className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${
                    couponApplied ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {couponApplied && (
                    <Check className="size-3.5 shrink-0 text-emerald-600" />
                  )}
                  {promoCodeError}
                </p>
              )}
            </div>

            {finalAmount < MIN_PAYABLE_AMOUNT && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 border border-amber-200">
                Minimum order amount must be at least ₹{MIN_PAYABLE_AMOUNT.toFixed(2)} to checkout.
              </p>
            )}

            {orderError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {orderError}
              </p>
            )}

            <Button
              disabled={placingOrder || availableCartItems.length === 0 || finalAmount < MIN_PAYABLE_AMOUNT || !calcResult.isValid}
              className="w-full cursor-pointer rounded-xl bg-rose-600 py-6 text-base font-semibold text-white shadow-md hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* COD SECURITY & CONFIRMATION MODAL */}
      {showCodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-rose-100 bg-white p-6 shadow-2xl transition-all sm:p-7">
            {/* Close button */}
            <button
              type="button"
              onClick={() => {
                if (!placingOrder) setShowCodModal(false);
              }}
              disabled={placingOrder}
              className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition cursor-pointer"
            >
              <X className="size-5" />
            </button>

            {/* Header */}
            <div className="text-center">
              <div className="mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-100">
                <ShieldCheck className="size-4 text-rose-600" />
                COD Security Verification
              </div>
              <h3 className="font-serif text-2xl font-bold text-gray-900">
                Confirm Your COD Order
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Please complete the verification below to confirm your Cash on Delivery order.
              </p>
            </div>

            {/* Delivery & Total Summary */}
            <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50/80 p-4 text-xs space-y-2">
              <div className="flex justify-between font-medium text-gray-700">
                <span>Amount on Delivery:</span>
                <span className="font-bold text-rose-700 text-sm">
                  ₹{finalAmount.toFixed(2)}
                </span>
              </div>
              <div className="border-t border-gray-200/60 pt-2 text-gray-600">
                <p className="font-semibold text-gray-800">{recipientName}</p>
                <p className="line-clamp-1 mt-0.5">
                  {address}
                  {landmark ? `, ${landmark}` : ""}, {city}, {state} - {zip}
                </p>
                <p className="mt-0.5 text-gray-500">Phone: +91 {phone}</p>
              </div>
            </div>

            {/* CAPTCHA Widget */}
            <div className="mt-5">
              <p className="mb-2 text-center text-xs font-medium text-gray-700">
                Verify you are human:
              </p>
              <CaptchaWidget
                onVerify={(token) => {
                  setCaptchaToken(token);
                  setCodModalError("");
                }}
                onExpire={() => setCaptchaToken("")}
              />
            </div>

            {/* Error display */}
            {codModalError && (
              <p className="mt-3 text-center text-xs font-medium text-red-600">
                {codModalError}
              </p>
            )}

            {/* Action Buttons */}
            <div className="mt-5 flex flex-col gap-2.5">
              <Button
                type="button"
                disabled={placingOrder || !captchaToken || finalAmount < MIN_PAYABLE_AMOUNT || !calcResult.isValid}
                onClick={() => confirmCodOrder()}
                className="w-full cursor-pointer rounded-xl bg-rose-600 py-5 text-sm font-semibold text-white shadow-md hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {placingOrder ? (
                  <VscLoading className="animate-spin text-lg" />
                ) : (
                  `Confirm & Place Order · ₹${finalAmount.toFixed(2)}`
                )}
              </Button>

              <button
                type="button"
                disabled={placingOrder}
                onClick={() => setShowCodModal(false)}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700 py-1 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
