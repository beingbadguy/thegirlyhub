export const GUEST_CART_KEY = "girlyhub_guest_cart";

export type GuestCartItem = {
  productId: string;
  quantity: number;
  size: string;
};

export function readGuestCart(): GuestCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item) =>
          item &&
          typeof item.productId === "string" &&
          Number(item.quantity) >= 1,
      )
      .map((item) => ({
        productId: item.productId,
        quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
        size: typeof item.size === "string" ? item.size : "",
      }));
  } catch {
    return [];
  }
}

export function writeGuestCart(items: GuestCartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

export function clearGuestCart() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_CART_KEY);
}

export function addGuestCartItem(productId: string, size = "", quantity = 1) {
  const items = readGuestCart();
  const existing = items.find(
    (item) => item.productId === productId && (item.size || "") === (size || ""),
  );
  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({ productId, size: size || "", quantity });
  }
  writeGuestCart(items);
  return items;
}

export function updateGuestCartQuantity(
  productId: string,
  quantity: number,
  size?: string,
) {
  const items = readGuestCart().map((item) => {
    const matchesProduct = item.productId === productId;
    const matchesSize = size !== undefined ? (item.size || "") === (size || "") : true;
    if (matchesProduct && matchesSize) {
      return { ...item, quantity: Math.max(1, quantity) };
    }
    return item;
  });
  writeGuestCart(items);
  return items;
}

export function removeGuestCartItem(productId: string, size?: string) {
  const items = readGuestCart().filter((item) => {
    const matchesProduct = item.productId === productId;
    const matchesSize = size !== undefined ? (item.size || "") === (size || "") : true;
    return !(matchesProduct && matchesSize);
  });
  writeGuestCart(items);
  return items;
}
