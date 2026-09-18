export type StockProduct = {
  isActive?: boolean;
  countInStock?: number;
  stock?: number;
  totalStock?: number;
  status?: string;
};

export function isProductInStock(product: StockProduct | null | undefined): boolean {
  if (!product) return false;
  if (
    product.status === "out_of_stock" ||
    product.status === "draft" ||
    product.status === "archived" ||
    product.isActive === false
  ) {
    return false;
  }
  const stock = product.countInStock ?? product.totalStock ?? product.stock ?? 0;
  return stock > 0;
}

export function getAvailableQuantity(product: StockProduct | null | undefined): number {
  if (!product || !isProductInStock(product)) return 0;
  return product.countInStock ?? product.totalStock ?? product.stock ?? 0;
}
