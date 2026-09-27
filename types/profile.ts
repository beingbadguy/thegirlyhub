export type AddressType = "shipping" | "home" | "work" | "other";

export interface SavedAddress {
  id: string;
  type: AddressType | string;
  isDefault: boolean;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  landmark?: string | null;
}

export interface UserProfileData {
  _id: string;
  id: string;
  name: string;
  email: string;
  role: string;
  authProvider: "local" | "google" | "facebook" | "apple" | string;
  image?: string | null;
  isVerified: boolean;
  firstPurchase: boolean;
  phone?: string | number | null;
  address?: string;
  city?: string;
  state?: string;
  landmark?: string | null;
  zip?: string | number | null;
  country?: string;
  addresses: SavedAddress[];
  ordersCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export type ProfileMenuKey =
  | "account"
  | "orders"
  | "addresses"
  | "security"
  | "wishlist"
  | "cart";

export type OrderStatusKey =
  | "processing"
  | "reviewing"
  | "preparing"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled";

export type OrderFilterKey = "all" | OrderStatusKey;

export type OrderSortKey =
  | "newest"
  | "oldest"
  | "amount_high"
  | "amount_low";

export interface StatusCounts {
  all: number;
  processing: number;
  reviewing: number;
  preparing: number;
  shipped: number;
  delivered: number;
  completed: number;
  cancelled: number;
  [key: string]: number;
}
