import { create } from "zustand";
import axios, { AxiosError } from "axios";
import {
  addGuestCartItem,
  clearGuestCart,
  readGuestCart,
  removeGuestCartItem,
  updateGuestCartQuantity,
} from "@/lib/guestCart";

// Define the shape of your authentication state
interface AuthState {
  user: {
    _id: string;
    name: string;
    email: string;
    isVerified: boolean;
    role: string;
    createdAt: string;
    address: string;
    city?: string;
    state?: string;
    landmark?: string;
    phone: number;
    image: string;
    firstPurchase: boolean;
    zip: number;
    wishlist?: { products: WishlistItem[] }[];
  } | null;
  isLoggingOut: boolean;
  userCart: PopulatedCartProduct | null;
  userWishlist: PopulatedWishlist | null;
  fetchUser: () => Promise<void>;
  logout: () => void;
  setUser: (user: any) => void;
  addToWishlist: (id: string) => void;
  fetchUserCart: () => Promise<void>;
  fetchUserWishlist: () => void;
  addToCart: (productId: string, size?: string) => Promise<void>;
  updateCartQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  syncCartAfterAuth: () => Promise<void>;
}
type PopulatedCartProduct = {
  products: CartProduct[];
};

type CartProduct = {
  productId: Products;
  quantity: number;
  size: string;
};

type PopulatedWishlist = {
  _id: string;
  userId: string;
  products: {
    _id: string;
    productId: Products; // now fully populated with product details
  }[];
  createdAt: string;
  updatedAt: string;
  __v: number;
};

type WishlistItem = {
  productId: Products;
};

interface Products {
  _id: string;
  title: string;
  description: string;
  price: number;
  discountedPrice: number;
  countInStock: number;
  rating: number;
  numReviews: number;
  image: string;
  discountPercentage: number;
  isActive: boolean;
  category: string;
}

async function hydrateGuestCart() {
  const items = readGuestCart();
  if (!items.length) {
    return { products: [] };
  }
  const response = await axios.post("/api/cart/hydrate", { products: items });
  return response.data.cart;
}

// Create Zustand store
export const useAuthStore = create<AuthState>((set, get) => ({
  userWishlist: null,
  userCart: null,
  user: null,
  isLoggingOut: false,
  setUser: (user) => set({ user }),

  fetchUser: async () => {
    try {
      const response = await axios.get("/api/me");
      set({ user: response.data.user });

      const { fetchUserCart, fetchUserWishlist, syncCartAfterAuth } = get();
      await syncCartAfterAuth();
      fetchUserWishlist();
      fetchUserCart();
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        if (error.response?.status !== 401) {
          console.error(error.response?.data);
        }
      } else {
        console.error("Failed to fetch user", error);
      }
      set({ user: null });
      await get().fetchUserCart();
    }
  },

  logout: async () => {
    set({ isLoggingOut: true });
    try {
      await axios.post("/api/logout");
      set({ user: null, userCart: null, userWishlist: null });
      await get().fetchUserCart();
    } catch (error) {
      console.error("Failed to logout", error);
    } finally {
      set({ isLoggingOut: false });
    }
  },
  addToWishlist: async (id: string) => {
    const user = get().user;
    if (!id) {
      console.log("You must provide a product id.");
      return;
    }
    if (!user) {
      console.log("You must be logged in to add to wishlist.");
      return;
    }
    try {
      await axios.post(`/api/wishlist/${id}`);
      get().fetchUser();
    } catch (error) {
      console.error("Failed to add to wishlist:", error);
    }
  },
  fetchUserCart: async () => {
    try {
      if (!get().user) {
        const cart = await hydrateGuestCart();
        set({ userCart: cart });
        return;
      }
      const response = await axios.get(`/api/cart`);
      set({ userCart: response.data.cart });
    } catch (error) {
      if (error instanceof AxiosError) {
        console.log(error.response?.data);
      }
      console.error("Failed to fetch cart", error);
    }
  },

  fetchUserWishlist: async () => {
    try {
      const response = await axios.get(`/api/wishlist`);
      set({ userWishlist: response.data.wishlist });
    } catch (error) {
      if (error instanceof AxiosError) {
        console.log(error.response?.data?.message);
      }
    }
  },

  addToCart: async (productId: string, size = "") => {
    if (get().user) {
      await axios.post(`/api/cart/${productId}`, { size });
    } else {
      addGuestCartItem(productId, size);
    }
    await get().fetchUserCart();
  },

  updateCartQuantity: async (productId: string, quantity: number) => {
    if (get().user) {
      await axios.put(`/api/cart/${productId}`, { quantity });
    } else {
      updateGuestCartQuantity(productId, quantity);
    }
    await get().fetchUserCart();
  },

  removeFromCart: async (productId: string) => {
    if (get().user) {
      await axios.delete(`/api/cart/${productId}`);
    } else {
      removeGuestCartItem(productId);
    }
    await get().fetchUserCart();
  },

  syncCartAfterAuth: async () => {
    const items = readGuestCart();
    if (!get().user || !items.length) return;
    try {
      await axios.post("/api/cart/merge", { products: items });
      clearGuestCart();
    } catch (error) {
      console.error("Failed to merge guest cart", error);
    }
  },
}));
