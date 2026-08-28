import { create } from "zustand";
import axios, { AxiosError } from "axios";

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
  fetchUserCart: () => void;
  fetchUserWishlist: () => void;
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

// Create Zustand store
export const useAuthStore = create<AuthState>((set) => ({
  userWishlist: null,
  userCart: null,
  user: null,
  isLoggingOut: false,
  setUser: (user) => set({ user }),

  fetchUser: async () => {
    try {
      const response = await axios.get("/api/me");
      // console.log(response.data.user);
      set({ user: response.data.user });

      const { fetchUserCart, fetchUserWishlist } = useAuthStore.getState();
      fetchUserWishlist();
      fetchUserCart();
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error(error.response?.data);
      } else {
        console.error("Failed to fetch user", error);
      }
      set({ user: null });
    }
  },

  logout: async () => {
    set({ isLoggingOut: true }); // Show loading spinner while logging out
    try {
      await axios.post("/api/logout");
      set({ user: null });
      set({ userCart: null });
      set({ userWishlist: null });
    } catch (error) {
      console.error("Failed to logout", error);
    } finally {
      set({ isLoggingOut: false });
    }
  },
  addToWishlist: async (id: string) => {
    const user = useAuthStore.getState().user;
    if (!id) {
      console.log("You must provide a product id.");
      return;
    }
    if (!user) {
      console.log("You must be logged in to add to wishlist.");
      return;
    }
    try {
      const response = await axios.post(`/api/wishlist/${id}`);
      // console.log(response.data);
      useAuthStore.getState().fetchUser();
    } catch (error) {
      console.error("Failed to add to wishlist:", error);
    }
  },
  fetchUserCart: async () => {
    try {
      const response = await axios.get(`/api/cart`);
      console.log("user cart is called");
      set({ userCart: response.data.cart });
    } catch (error) {
      if (error instanceof AxiosError) {
        console.log(error.response?.data);
      }
      console.error("Failed to add to cart", error);
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
      // console.error("Failed to add to cart", error?.message);
    }
  },
}));
