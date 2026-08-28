type StockProduct = {
  isActive?: boolean;
  countInStock?: number;
};

export function isProductInStock(product: StockProduct): boolean {
  return Boolean(product.isActive) && (product.countInStock ?? 0) > 0;
}

export function getAvailableQuantity(product: StockProduct): number {
  if (!isProductInStock(product)) return 0;
  return product.countInStock ?? 0;
}
