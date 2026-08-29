"use client";

import { useAuthStore } from "@/store/store";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import BreadcrumbHome from "@/components/BreadcrumbHome";
import { Minus, Plus, Trash2, Sparkles, AlertCircle } from "lucide-react";
import Image from "next/image";
import axios, { AxiosError } from "axios";
import { calculateShipping, FIRST_ORDER_DISCOUNT_RATE } from "@/lib/shipping";
import { getAvailableQuantity, isProductInStock } from "@/lib/productStock";

const CartPage = () => {
  const { user, fetchUserCart, userCart } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    document.title = "Shopping Bag | GirlyHub";
    if (!user) {
      router.push("/login");
    } else {
      fetchUserCart();
    }
  }, [user]);
  // console.log(user?.firstPurchase);

  const handleChangeCartQuantity = async (
    productId: string,
    quantity: number
  ) => {
    // console.log("Increase/decrease quantity for:", productId);

    try {
      await axios.put(`/api/cart/${productId}`, {
        quantity: quantity,
      });
      // console.log(response.data);
      fetchUserCart();
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error(error.response?.data);
      } else {
        console.error("Failed to add to cart", error);
      }
    }
  };

  const handleDelete = async (productId: string) => {
    // console.log("Delete product:", productId);

    try {
      await axios.delete(`/api/cart/${productId}`);
      // console.log(response.data);
      fetchUserCart();
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error(error.response?.data);
      } else {
        console.error("Failed to add to cart", error);
      }
    }
  };

  const cartItems = userCart?.products ?? [];
  const availableItems = cartItems.filter((item) =>
    isProductInStock(item.productId),
  );
  const unavailableItems = cartItems.filter(
    (item) => !isProductInStock(item.productId),
  );

  const subtotal = availableItems.reduce(
    (acc, item) => acc + item.productId.discountedPrice * item.quantity,
    0,
  );

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
    if (subtotal > 0 && prevSubtotalRef.current < 499 && subtotal >= 499) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 4000);
      return () => clearTimeout(timer);
    }
    prevSubtotalRef.current = subtotal;
  }, [subtotal]);

  return (
    <div className="p-4 min-h-[90vh]">
      <div className="text-sm text-gray-500 mb-4 flex items-center gap-1.5 flex-wrap">
        <BreadcrumbHome />{" "}
        / <span className="cursor-pointer text-black">Cart</span>{" "}
      </div>

      <h1 className="py-2 font-bold text-pink-700 text-3xl">Your Cart</h1>

      {cartItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="md:col-span-2 space-y-6">
            {availableItems.map((item) => (
              <div
                key={item.productId._id}
                className="flex gap-4 border-b pb-4"
              >
                <Image
                  src={item.productId.image}
                  alt={item.productId.title}
                  width={100}
                  height={100}
                  className="object-contain rounded bg-[#fffafc] p-1"
                />
                <div className="flex-1">
                  <h2 className="font-semibold text-lg">
                    {item.productId.title}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Category: {item.productId.category}
                  </p>
                  {/* <p className="text-sm text-gray-600">
                    Color: {item.productId.color}
                  </p> */}

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
                              item.quantity - 1
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
                      onClick={() => handleDelete(item.productId._id)}
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
                    ₹{item.productId.discountedPrice || item.productId.price}
                  </div>
                </div>
              </div>
            ))}

            {unavailableItems.length > 0 && (
              <div className="rounded-lg border border-red-100 bg-red-50/50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-red-700">
                  Out of stock — not included in total
                </h3>
                <div className="space-y-4">
                  {unavailableItems.map((item) => (
                    <div
                      key={item.productId._id}
                      className="flex gap-4 opacity-70"
                    >
                      <Image
                        src={item.productId.image}
                        alt={item.productId.title}
                        width={80}
                        height={80}
                        className="rounded bg-white object-contain p-1 grayscale"
                      />
                      <div className="flex flex-1 items-start justify-between">
                        <div>
                          <h2 className="font-semibold text-gray-700 line-through">
                            {item.productId.title}
                          </h2>
                          <p className="mt-1 text-xs font-medium text-red-600">
                            Out of stock
                          </p>
                        </div>
                        <button
                          onClick={() => handleDelete(item.productId._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border border-pink-100 bg-white p-5 rounded-2xl shadow-sm space-y-4 h-fit text-sm">
            {/* Free Shipping Progress Indicator */}
            <div className="space-y-2 p-3 bg-pink-50/55 rounded-xl border border-pink-100/50">
              <div className="flex justify-between text-xs font-semibold">
                <span className={isFreeShipping ? "text-green-600 flex items-center gap-1" : "text-gray-600"}>
                  {isFreeShipping ? (
                    <>🚀 Free shipping unlocked!</>
                  ) : (
                    <>Add <span className="font-bold text-pink-600">₹{remainingForFreeShipping}</span> more to get FREE shipping 🚚</>
                  )}
                </span>
                <span className="text-gray-500 font-bold">₹{subtotal} / ₹499</span>
              </div>
              <div className="w-full bg-gray-200/80 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-pink-600 h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
              {isFreeShipping && (
                <div className="text-[11px] text-green-700 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-green-600 animate-pulse" /> You saved ₹49 on shipping 🎉
                </div>
              )}
            </div>

            <h2 className="text-lg font-bold text-gray-900">Product Summary</h2>
            <hr className="w-full border-gray-100" />
            <div className="flex justify-between text-gray-600">
              <p>Total products</p>
              <p className="font-semibold text-gray-800">{availableItems.length} Products</p>
            </div>
            <div className="flex justify-between text-gray-600">
              <p>Subtotal</p>
              <p className="font-semibold text-gray-800">₹{subtotal.toFixed(2)}</p>
            </div>

            <div className="flex justify-between text-gray-600">
              <p>Delivery charge</p>
              {isFreeShipping ? (
                <p className="text-green-600 font-bold flex items-center gap-1">
                  <span className="line-through text-xs text-gray-400 font-normal">₹49.00</span> FREE
                </p>
              ) : (
                <p className="font-semibold text-gray-800">₹{shippingCharge.toFixed(2)}</p>
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
              <p className="text-pink-600 text-lg">₹{totalAfterDiscount.toFixed(2)}</p>
            </div>

            <button
              className="w-full bg-black hover:bg-black/80 active:scale-95 transition-all duration-200 cursor-pointer text-white py-3 font-semibold rounded-xl disabled:cursor-not-allowed disabled:opacity-50"
              disabled={availableItems.length === 0}
              onClick={() => {
                router.push("/checkout");
              }}
            >
              {availableItems.length === 0 ? "NO ITEMS TO CHECKOUT" : "CHECKOUT"}
            </button>
            <p className="text-xs text-gray-500">
              By selecting a payment method, you agree to our Terms of Use,
              Sale, Return Policy, and Privacy Policy.
            </p>
          </div>
        </div>
      ) : (
        <p className="text-gray-600 my-2 text-sm">
          You do not have any items in your cart.
        </p>
      )}

      {/* Floating Free Shipping Toast */}
      {showToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-xl shadow-2xl border border-green-500 animate-bounce transition-all duration-300">
          <Sparkles className="w-5 h-5 text-white" />
          <span className="font-bold text-sm">Congrats! You unlocked FREE shipping 🚀</span>
        </div>
      )}
    </div>
  );
};

export default CartPage;
