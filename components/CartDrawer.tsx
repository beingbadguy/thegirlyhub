"use client";

import { useAuthStore } from "@/store/store";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { calculateShipping } from "@/lib/shipping";
import { productUrl } from "@/lib/slug";

export default function CartDrawer() {
  const {
    isCartOpen,
    closeCart,
    userCart,
    updateCartQuantity,
    removeFromCart,
  } = useAuthStore();
  const items = (userCart?.products || []).filter((item) => item.productId);
  const subtotal = items.reduce(
    (total, item) =>
      total +
      Number(
        item.productId.discountedPrice ||
          item.productId.price ||
          (item.productId as any).sellingPrice ||
          (item.productId as any).discountPrice ||
          0,
      ) *
        item.quantity,
    0,
  );
  const shipping = calculateShipping(subtotal, "online");

  return (
    <>
      {isCartOpen && (
        <button
          type="button"
          aria-label="Close cart"
          onClick={closeCart}
          className="fixed inset-0 z-[1100] bg-black/35"
        />
      )}
      <aside
        aria-label="Shopping cart"
        className={`fixed right-0 top-0 z-[1101] flex h-dvh w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${isCartOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <header className="flex items-center justify-between border-b border-neutral-100 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-400">
              Your selection
            </p>
            <h2 className="mt-1 text-2xl font-bold text-neutral-900">Cart</h2>
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="flex size-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition hover:bg-neutral-50"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <ShoppingBag
                className="size-10 text-rose-300"
                strokeWidth={1.5}
              />
              <p className="mt-4 font-semibold text-neutral-900">
                Your cart is empty
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                Add something beautiful to your bag.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {items.map((item) => {
                const product = item.productId;
                const image = product.image || "/placeholder.png";
                const itemHref = productUrl(product.title, product._id, (product as any).slug);
                const unitPrice = Number(
                  product.discountedPrice ||
                    product.price ||
                    (product as any).sellingPrice ||
                    (product as any).discountPrice ||
                    0,
                );
                return (
                  <div
                    key={product._id}
                    className="flex gap-4 border-b border-neutral-100 pb-5"
                  >
                    <Link
                      href={itemHref}
                      onClick={closeCart}
                      className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100 transition hover:opacity-80"
                    >
                      <Image
                        src={image}
                        alt={product.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          href={itemHref}
                          onClick={closeCart}
                          className="line-clamp-2 text-sm font-semibold text-neutral-900 transition hover:text-rose-600"
                        >
                          {product.title}
                        </Link>
                        <button
                          type="button"
                          aria-label={`Remove ${product.title}`}
                          onClick={() => removeFromCart(product._id)}
                          className="shrink-0 text-neutral-400 transition hover:text-rose-600"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <p className="mt-1 text-sm font-bold text-neutral-900">
                        ₹{unitPrice.toLocaleString("en-IN")}
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() =>
                            item.quantity <= 1
                              ? removeFromCart(product._id)
                              : updateCartQuantity(
                                  product._id,
                                  item.quantity - 1,
                                )
                          }
                          className="flex size-7 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="min-w-4 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() =>
                            updateCartQuantity(product._id, item.quantity + 1)
                          }
                          className="flex size-7 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <footer className="border-t border-neutral-100 bg-white px-6 py-5">
          {items.length === 0 ? (
            <button
              type="button"
              onClick={closeCart}
              className="w-full rounded-full bg-rose-500 py-3 text-center text-sm font-semibold text-white transition hover:bg-rose-600 active:scale-[0.99]"
            >
              Start Shopping
            </button>
          ) : (
            <>
              <div className="mb-5 rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      {shipping.isFreeShipping
                        ? "Free delivery unlocked"
                        : `Add ₹${shipping.remainingForFreeShipping.toLocaleString("en-IN")} more`}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {shipping.isFreeShipping
                        ? "Your order qualifies for complimentary delivery."
                        : "Shop a little more to unlock free delivery."}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-rose-600">
                    ₹{Math.min(subtotal, 499).toLocaleString("en-IN")} / ₹499
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${shipping.isFreeShipping ? "bg-emerald-500" : "bg-rose-500"}`}
                    style={{ width: `${shipping.freeShippingProgress}%` }}
                  />
                </div>
                {shipping.isFreeShipping && (
                  <p className="mt-2 text-xs font-medium text-emerald-600">
                    You saved ₹49 on delivery
                  </p>
                )}
              </div>
              <div className="mb-4 flex items-center justify-between text-base font-semibold">
                <span>Total</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/cart"
                  onClick={closeCart}
                  className="rounded-full border border-neutral-200 py-3 text-center text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                >
                  View cart
                </Link>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="rounded-full bg-rose-500 py-3 text-center text-sm font-semibold text-white hover:bg-rose-600"
                >
                  Buy now
                </Link>
              </div>
            </>
          )}
        </footer>
      </aside>
    </>
  );
}
