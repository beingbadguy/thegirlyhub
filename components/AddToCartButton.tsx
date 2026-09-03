"use client";

import { ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { AxiosError } from "axios";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/store";

type AddToCartButtonProps = {
  productId: string;
  inStock?: boolean;
  children?: ReactNode;
  className?: string;
  buyNow?: boolean;
};

export default function AddToCartButton({
  productId,
  inStock = true,
  children,
  className,
  buyNow = false,
}: AddToCartButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addToCart = async () => {
    if (!inStock) {
      setError("Out of stock");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await useAuthStore.getState().addToCart(productId, "");
      if (buyNow) router.push("/cart");
    } catch (error) {
      if (error instanceof AxiosError) {
        setError(error.response?.data?.message || "Could not add to cart");
      }
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !inStock;

  return (
    <div className={children ? "w-full" : undefined}>
      <button
        type="button"
        aria-label={buyNow ? "Buy product now" : "Add product to cart"}
        title={
          !inStock
            ? "Out of stock"
            : buyNow
              ? "Buy now"
              : "Add to cart"
        }
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation();
          addToCart();
        }}
        className={cn(
          children
            ? "flex w-full items-center justify-center rounded-full bg-[#fff0f5] text-[#b42362] shadow-sm transition hover:bg-[#f9d5e4] disabled:cursor-not-allowed disabled:opacity-50"
            : "flex size-9 items-center justify-center rounded-full bg-[#fff0f5] text-[#b42362] shadow-sm transition hover:bg-[#f9d5e4] disabled:cursor-not-allowed disabled:opacity-50",
          !inStock && "opacity-50",
          className,
        )}
      >
        {loading
          ? "…"
          : !inStock && !children
            ? null
            : children || <ShoppingBag className="size-4" />}
      </button>
      {error && (
        <p className="mt-1 text-center text-[10px] leading-tight text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
