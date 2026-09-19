"use client";

import { useAuthStore } from "@/store/store";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import BreadcrumbHome from "@/components/BreadcrumbHome";
import { Minus, Plus, Trash2, Sparkles, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AxiosError } from "axios";
import { calculateShipping, FIRST_ORDER_DISCOUNT_RATE, FREE_SHIPPING_THRESHOLD, SHIPPING_CHARGE } from "@/lib/shipping";
import { getAvailableQuantity, isProductInStock } from "@/lib/productStock";
import GuestAuthPrompt from "@/components/GuestAuthPrompt";
import FreeShippingBar from "@/components/FreeShippingBar";
import CartSkeleton from "@/components/CartSkeleton";
import { productUrl } from "@/lib/slug";
import FloralAccent from "@/components/decorations/FloralAccent";

const CartPage = () => {
  const { user, userCart, isCartLoading, isCartUpdating, updateCartQuantity, removeFromCart } = useAuthStore();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    document.title = "Shopping Cart | GirlyHub";
    useAuthStore
      .getState()
      .fetchUser()
      .finally(() => setAuthChecked(true));
  }, []);

  const handleChangeCartQuantity = async (
    productId: string,
    quantity: number,
    size?: string,
  ) => {
    try {
      await updateCartQuantity(productId, quantity, size);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error(error.response?.data);
      } else {
        console.error("Failed to update cart quantity", error);
      }
    }
  };

  const handleDelete = async (productId: string, size?: string) => {
    try {
      await removeFromCart(productId, size);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error(error.response?.data);
      } else {
        console.error("Failed to remove item from cart", error);
      }
    }
  };

  const cartItems = userCart?.products ?? [];
  const validCartItems = cartItems.filter(
    (item) => item.productId !== null && item.productId !== undefined,
  );
  const availableItems = validCartItems.filter((item) =>
    isProductInStock(item.productId),
  );
  const unavailableItems = validCartItems.filter(
    (item) => !isProductInStock(item.productId),
  );

  const subtotal = availableItems.reduce((acc, item) => {
    const p = item.productId;
    const price = Number(
      p.discountedPrice ||
        p.price ||
        (p as any).sellingPrice ||
        (p as any).discountPrice ||
        0,
    );
    return acc + price * item.quantity;
  }, 0);

  // Dynamic shipping calculation
  const shippingResult = calculateShipping(subtotal, "online");
  const shippingCharge = shippingResult.shippingCharge;
  const remainingForFreeShipping = shippingResult.remainingForFreeShipping;
  const isFreeShipping = shippingResult.isFreeShipping;
  const freeShippingProgress = shippingResult.freeShippingProgress;

  const firstTimeDiscount = user?.firstPurchase
    ? 0
    : (subtotal + shippingCharge) * FIRST_ORDER_DISCOUNT_RATE;
  const totalAfterDiscount = subtotal + shippingCharge - firstTimeDiscount;

  // State for Toast Notification
  const [showToast, setShowToast] = useState(false);
  const prevSubtotalRef = useRef(subtotal);

  useEffect(() => {
    if (subtotal > 0 && prevSubtotalRef.current < FREE_SHIPPING_THRESHOLD && subtotal >= FREE_SHIPPING_THRESHOLD) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 4000);
      return () => clearTimeout(timer);
    }
    prevSubtotalRef.current = subtotal;
  }, [subtotal]);

  // Show rich animated Skeleton Loader while checking auth or loading cart
  if (!authChecked || (isCartLoading && !userCart)) {
    return <CartSkeleton />;
  }

  return (
    <div className="min-h-[90vh] bg-[#fffafb]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex items-center gap-2 text-xs md:text-sm text-neutral-500"
        >
          <BreadcrumbHome />
          <span className="text-neutral-300">/</span>
          <span className="font-semibold text-neutral-900">Cart</span>
        </nav>

        <div className="flex items-center gap-3 py-2">
          <h1 className="font-bold text-pink-700 text-3xl font-serif">Your Cart</h1>
          <FloralAccent flower={1} size="xs" variant="pulse" className="opacity-80" />
        </div>

        {!user && (
          <div className="mt-3 mb-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-pink-100 bg-pink-50/70 px-4 py-3 text-xs sm:text-sm text-neutral-700">
            <div className="flex items-center gap-2">
              <span className="text-base">🛍️</span>
              <span>
                Shopping as a <strong>guest</strong>. Your items are saved in this browser.
              </span>
            </div>
            <Link
              href="/login?next=/cart"
              className="rounded-full border border-pink-200 bg-white px-3 py-1 font-semibold text-xs text-pink-700 hover:bg-pink-100 transition shadow-xs"
            >
              Log in to save across devices
            </Link>
          </div>
        )}

      {cartItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="md:col-span-2 space-y-6">
            {availableItems.map((item) => {
              const itemUrl = productUrl(
                item.productId.title,
                item.productId._id,
                (item.productId as any).slug,
              );
              const unitPrice = Number(
                item.productId.discountedPrice ||
                  item.productId.price ||
                  (item.productId as any).sellingPrice ||
                  (item.productId as any).discountPrice ||
                  0,
              );

              return (
                <div
                  key={item.productId._id}
                  className="flex gap-4 border-b pb-4"
                >
                  <Link
                    href={itemUrl}
                    className="shrink-0 transition hover:opacity-80"
                  >
                    <Image
                      src={item.productId.image}
                      alt={item.productId.title}
                      width={100}
                      height={100}
                      className="object-contain rounded bg-[#fffafc] p-1"
                    />
                  </Link>
                  <div className="flex-1">
                    <Link
                      href={itemUrl}
                      className="font-semibold text-lg hover:text-pink-700 transition line-clamp-2"
                    >
                      {item.productId.title}
                    </Link>
                    <p className="text-sm text-gray-600">
                      Category: {item.productId.category}
                    </p>
                    {item.size && (
                      <p className="text-sm font-medium text-gray-700 mt-0.5">
                        Size: <span className="font-bold text-rose-600">{item.size}</span>
                      </p>
                    )}

                  {/* <div className="mt-2 flex items-center gap-4">
                    <p className="text-sm font-medium">Product size</p>
                    <select className="border p-1 rounded">
                      {item.productId.sizes.map((size) => (
                        <option
                          key={size}
                          value={size}
                          selected={item.size === size}
                        >
                          {size}
                        </option>
                      ))}
                    </select>
                  </div> */}

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium hidden md:block">
                      Quantity
                    </p>
                    <div className="flex items-center ">
                      <button
                        onClick={() => {
                          if (item.quantity > 1) {
                            handleChangeCartQuantity(
                              item.productId._id,
                              item.quantity - 1,
                              item.size,
                            );
                          } else {
                            console.log("Quantity cannot be less than 1");
                          }
                        }}
                        className="p-1 bg-gray-100 active:scale-90 transition-transform duration-200 hover:bg-gray-200 cursor-pointer rounded-full size-10 flex items-center justify-center"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="px-3">{item.quantity}</span>
                      <button
                        onClick={() => {
                          const maxQty = getAvailableQuantity(item.productId);
                          if (item.quantity < maxQty) {
                            handleChangeCartQuantity(
                              item.productId._id,
                              item.quantity + 1,
                              item.size,
                            );
                          }
                        }}
                        disabled={
                          item.quantity >= getAvailableQuantity(item.productId)
                        }
                        className="p-1 bg-gray-100 hover:bg-gray-200 active:scale-90 transition-transform duration-200 cursor-pointer rounded-full size-10 flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <button
                      onClick={() => handleDelete(item.productId._id, item.size)}
                      className="ml-4 text-red-600 hover:text-red-800 cursor-pointer"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  {item.size && item.size.toLowerCase() !== "one size" && (
                    <div className=" text-gray-500 text-sm font-semibold italic mt-2 md:mt-0">
                      size:{item.size}
                    </div>
                  )}

                  <div className="mt-2 text-pink-500 text-sm font-semibold ">
                    ₹{unitPrice.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            );
          })}

            {unavailableItems.length > 0 && (
              <div className="rounded-lg border border-red-100 bg-red-50/50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-red-700">
                  Out of stock — not included in total
                </h3>
                <div className="space-y-4">
                  {unavailableItems.map((item) => {
                    const itemUrl = productUrl(
                      item.productId.title,
                      item.productId._id,
                      (item.productId as any).slug,
                    );
                    return (
                      <div
                        key={item.productId._id}
                        className="flex gap-4 opacity-70"
                      >
                        <Link
                          href={itemUrl}
                          className="shrink-0 transition hover:opacity-80"
                        >
                          <Image
                            src={item.productId.image}
                            alt={item.productId.title}
                            width={80}
                            height={80}
                            className="rounded bg-white object-contain p-1 grayscale"
                          />
                        </Link>
                        <div className="flex flex-1 items-start justify-between">
                          <div>
                            <Link
                              href={itemUrl}
                              className="font-semibold text-gray-700 line-through hover:text-pink-700 transition"
                            >
                              {item.productId.title}
                            </Link>
                            <p className="mt-1 text-xs font-medium text-red-600">
                              Out of stock
                            </p>
                          </div>
                          <button
                            onClick={() => handleDelete(item.productId._id, item.size)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="border border-pink-100 bg-white p-5 rounded-2xl shadow-sm space-y-4 h-fit text-sm">
            {/* Free Shipping Progress Indicator */}
            {/* <div className="space-y-2 p-3 bg-pink-50/55 rounded-xl border border-pink-100/50">
              <div className="flex justify-between text-xs font-semibold">
                <span
                  className={
                    isFreeShipping
                      ? "text-green-600 flex items-center gap-1"
                      : "text-gray-600"
                  }
                >
                  {isFreeShipping ? (
                    <>🚀 Free shipping unlocked!</>
                  ) : (
                    <>
                      Add{" "}
                      <span className="font-bold text-pink-600">
                        ₹{remainingForFreeShipping}
                      </span>{" "}
                      more to get FREE shipping 🚚
                    </>
                  )}
                </span>
                <span className="text-gray-500 font-bold">
                  ₹{subtotal} / ₹399
                </span>
              </div>
              <div className="w-full bg-gray-200/80 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-pink-600 h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
              {isFreeShipping && (
                <div className="text-[11px] text-green-700 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-green-600 animate-pulse" />{" "}
                  You saved ₹29 on shipping 🎉
                </div>
              )}
            </div> */}

            <FreeShippingBar
              isFreeShipping={isFreeShipping}
              remainingForFreeShipping={remainingForFreeShipping}
              subtotal={subtotal}
              freeShippingProgress={freeShippingProgress}
            />

            <h2 className="text-lg font-bold text-gray-900">Product Summary</h2>
            <hr className="w-full border-gray-100" />
            <div className="flex justify-between text-gray-600">
              <p>Total products</p>
              <p className="font-semibold text-gray-800">
                {availableItems.length} Products
              </p>
            </div>
            <div className="flex justify-between text-gray-600">
              <p>Subtotal</p>
              <p className="font-semibold text-gray-800">
                ₹{subtotal.toFixed(2)}
              </p>
            </div>

            <div className="flex justify-between text-gray-600">
              <p>Delivery charge</p>
              {isFreeShipping ? (
                <p className="text-green-600 font-bold flex items-center gap-1">
                  <span className="line-through text-xs text-gray-400 font-normal">
                    ₹{SHIPPING_CHARGE.toFixed(2)}
                  </span>{" "}
                  FREE
                </p>
              ) : (
                <p className="font-semibold text-gray-800">
                  ₹{shippingCharge.toFixed(2)}
                </p>
              )}
            </div>
            {!user?.firstPurchase && (
              <div className="flex justify-between text-green-600">
                <p>First time discount (15%)</p>
                <p>-₹{firstTimeDiscount.toFixed(2)}</p>
              </div>
            )}

            <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-3 text-gray-950">
              <p>Total payment</p>
              <p className="text-pink-600 text-lg">
                ₹{totalAfterDiscount.toFixed(2)}
              </p>
            </div>

            <button
              className="w-full bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all duration-200 cursor-pointer text-white py-3 font-semibold rounded-xl disabled:cursor-not-allowed disabled:opacity-50"
              disabled={availableItems.length === 0}
              onClick={() => {
                router.push("/checkout");
              }}
            >
              {availableItems.length === 0
                ? "NO ITEMS TO CHECKOUT"
                : "CHECKOUT"}
            </button>
            <p className="text-xs text-gray-500">
              By selecting a payment method, you agree to our Terms of Use,
              Sale, Return Policy, and Privacy Policy.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center p-8 bg-white/60 rounded-3xl border border-rose-100/60 my-6 shadow-xs relative overflow-hidden">
          <div className="pointer-events-none absolute -top-4 -right-4 opacity-40">
            <FloralAccent flower={1} size="lg" variant="float" />
          </div>
          <div className="pointer-events-none absolute -bottom-4 -left-4 opacity-35">
            <FloralAccent flower={3} size="md" variant="sway" />
          </div>

          <div className="relative mb-3">
            <FloralAccent flower={2} size="lg" variant="float" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 font-serif">
            Your cart is empty
          </h2>
          <p className="text-sm text-gray-500 max-w-md mb-6">
            Looks like you haven&apos;t added anything to your cart yet. Explore our latest arrivals and find something special! ✨
          </p>
          <Link
            href="/newarrivals"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-600 px-8 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-rose-700 hover:shadow-lg active:scale-95"
          >
            <Sparkles className="size-4" />
            Explore New Arrivals
          </Link>
        </div>
      )}

        {/* Floating Free Shipping Toast */}
        {showToast && (
          <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-xl shadow-2xl border border-green-500 animate-bounce transition-all duration-300">
            <Sparkles className="w-5 h-5 text-white" />
            <span className="font-bold text-sm">
              Congrats! You unlocked FREE shipping 🚀
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
