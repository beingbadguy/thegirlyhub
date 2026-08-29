export interface OrderProductInput {
  productId: string;
  quantity: number;
  size?: string;
  title: string;
  price: number;
  image: string;
}

export interface OrderInput {
  totalAmount: number;
  paymentMethod: "cod" | "online";
  deliveryType?: "normal" | "fast";
  recipientName: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  landmark?: string;
  orderNotes?: string;
  zip: string | number;
  phone: string | number;
  products: OrderProductInput[];
  couponCode?: string;
}

export type OrderFieldErrors = Partial<
  Record<
    | "recipientName"
    | "email"
    | "address"
    | "city"
    | "state"
    | "zip"
    | "phone"
    | "products"
    | "totalAmount"
    | "paymentMethod"
    | "deliveryType"
    | "general",
    string
  >
>;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  fieldErrors: OrderFieldErrors;
}

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Puducherry",
  "Chandigarh",
];

export function getOrderFieldErrors(
  data: Partial<OrderInput>,
): OrderFieldErrors {
  const fieldErrors: OrderFieldErrors = {};

  if (!data.recipientName?.trim() || data.recipientName.trim().length < 2) {
    fieldErrors.recipientName =
      "Recipient name must be at least 2 characters.";
  }

  if (!data.address?.trim() || data.address.trim().length < 10) {
    fieldErrors.address = "Delivery address must be at least 10 characters.";
  }

  if (!data.city?.trim() || data.city.trim().length < 2) {
    fieldErrors.city = "City is required.";
  }

  if (!data.state?.trim()) {
    fieldErrors.state = "State is required.";
  } else if (
    !INDIAN_STATES.some(
      (s) => s.toLowerCase() === data.state!.trim().toLowerCase(),
    )
  ) {
    fieldErrors.state = "Please select a valid Indian state.";
  }

  const zipStr = String(data.zip ?? "").trim();
  if (!/^\d{6}$/.test(zipStr)) {
    fieldErrors.zip = "Pincode must be exactly 6 digits.";
  }

  const phoneStr = String(data.phone ?? "").trim();
  if (!/^[6-9]\d{9}$/.test(phoneStr)) {
    fieldErrors.phone =
      "Phone must be a valid 10-digit Indian mobile number.";
  }

  if (data.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    fieldErrors.email = "Please enter a valid email address.";
  }

  if (!data.paymentMethod || !["cod", "online"].includes(data.paymentMethod)) {
    fieldErrors.paymentMethod = "Invalid payment method.";
  }

  if (
    data.deliveryType &&
    !["normal", "fast"].includes(data.deliveryType)
  ) {
    fieldErrors.deliveryType = "Invalid delivery type.";
  }

  if (!Array.isArray(data.products) || data.products.length === 0) {
    fieldErrors.products = "Your cart is empty.";
  }

  if (typeof data.totalAmount !== "number" || data.totalAmount <= 0) {
    fieldErrors.totalAmount = "Order total must be greater than zero.";
  }

  return fieldErrors;
}

export function validateOrderInput(data: Partial<OrderInput>): ValidationResult {
  const fieldErrors = getOrderFieldErrors(data);
  const errors = Object.values(fieldErrors).filter(Boolean) as string[];

  if (Array.isArray(data.products) && data.products.length > 0) {
    data.products.forEach((item, index) => {
      if (!item.productId) {
        errors.push(`Product ${index + 1}: missing product ID.`);
      }
      if (!item.quantity || item.quantity < 1) {
        errors.push(`Product ${index + 1}: quantity must be at least 1.`);
      }
      if (!item.title?.trim()) {
        errors.push(`Product ${index + 1}: title is required.`);
      }
      if (typeof item.price !== "number" || item.price <= 0) {
        errors.push(`Product ${index + 1}: invalid price.`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    fieldErrors,
  };
}

export { INDIAN_STATES };

// Re-export from the single source of truth
export { SHIPPING_CHARGE as DELIVERY_CHARGE, FIRST_ORDER_DISCOUNT_RATE } from "./shipping";
