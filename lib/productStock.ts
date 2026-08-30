type StockProduct = {
  isActive?: boolean;
  countInStock?: number;
};

export function isProductInStock(product: StockProduct | null | undefined): boolean {
  if (!product) return false;
  return Boolean(product.isActive) && (product.countInStock ?? 0) > 0;
}

export function getAvailableQuantity(product: StockProduct | null | undefined): number {
  if (!product || !isProductInStock(product)) return 0;
  return product.countInStock ?? 0;
}
