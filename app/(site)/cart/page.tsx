"use client";

import { useAuthStore } from "@/store/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import BreadcrumbHome from "@/components/BreadcrumbHome";
import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import axios, { AxiosError } from "axios";
import {
  DELIVERY_CHARGE,
  FIRST_ORDER_DISCOUNT_RATE,
} from "@/lib/orderValidation";
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

  const firstTimeDiscount = user?.firstPurchase
    ? 0
    : (subtotal + DELIVERY_CHARGE) * FIRST_ORDER_DISCOUNT_RATE;
  const totalAfterDiscount = subtotal + DELIVERY_CHARGE - firstTimeDiscount;

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

          <div className="border p-4 rounded-sm space-y-4 h-fit text-sm">
            <h1 className="text-xl font-bold ">Product Summary</h1>
            <hr className="w-full border border-gray-200 " />
            <div className="flex justify-between">
              <p>Total products</p>
              <p>{availableItems.length} Products</p>
            </div>
            <div className="flex justify-between">
              <p>Subtotal</p>
              <p>₹{subtotal.toFixed(2)}</p>
            </div>

            <div className="flex justify-between">
              <p>Delivery charge</p>
              <p>₹{DELIVERY_CHARGE.toFixed(2)}</p>
            </div>
            {!user?.firstPurchase && (
              <div className="flex justify-between">
                <p>First time discount</p>
                <p>₹{firstTimeDiscount.toFixed(2)}</p>
              </div>
            )}

            <div className="flex justify-between font-bold text-lg">
              <p>Total payment</p>
              <p>₹{totalAfterDiscount.toFixed(2)}</p>
            </div>

            <button
              className="w-full bg-black hover:bg-black/80 active:scale-90 transition-transform duration-200 cursor-pointer text-white py-3 font-semibold rounded disabled:cursor-not-allowed disabled:opacity-50"
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
    </div>
  );
};

export default CartPage;
