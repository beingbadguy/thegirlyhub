import axios from "axios";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Shiprocket API Helper (Production-Ready)
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides end-to-end integration with Shiprocket's external APIs:
 * - Authentication & Token Caching (in-memory with auto-refresh)
 * - Courier Serviceability (rate, delivery days, cheapest/fastest highlights)
 * - Order & Forward Shipment Creation (adhoc order + courier assignment)
 * - AWB Generation & Shipping Label Download
 * - Live Tracking & Webhook Status Processing
 * - Automatic simulated sandbox fallback when credentials are not configured or invalid
 * ─────────────────────────────────────────────────────────────────────────────
 */

const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

export interface ShiprocketCredentials {
  email?: string;
  password?: string;
}

export interface CourierOption {
  courier_id: number;
  courier_name: string;
  rate: number;
  estimated_days: string | number;
  rating?: number;
  cod_charges?: number;
  min_weight?: number;
  is_cheapest?: boolean;
  is_fastest?: boolean;
}

export interface ServiceabilityParams {
  pickup_postcode: string | number;
  delivery_postcode: string | number;
  cod: 0 | 1;
  weight: number; // in kg
}

export interface ServiceabilityResult {
  success: boolean;
  couriers: CourierOption[];
  cheapest_courier_id?: number;
  fastest_courier_id?: number;
  recommended_courier_id?: number;
  is_simulated?: boolean;
  message?: string;
}

export interface ShipmentItem {
  name: string;
  sku?: string;
  units: number;
  selling_price: number;
  discount?: number;
  tax?: number;
  hsn?: string | number;
}

export interface CreateShipmentInput {
  orderId: string;
  courier_id: number | string;
  weight: number; // in kg, default 0.2
  length: number; // in cm, default 10
  breadth: number; // in cm, default 10
  height: number; // in cm, default 2
  pickup_location?: string;
  forceRecreate?: boolean;
  // Order details from DB:
  customerName: string;
  phone: string | number;
  email?: string;
  address: string;
  city?: string;
  state?: string;
  pincode: string | number;
  items: ShipmentItem[];
  totalPrice: number;
  paymentMethod: "cod" | "online" | "Prepaid" | "COD";
}

export interface CreateShipmentResult {
  success: boolean;
  shipmentId: string;
  shiprocketOrderId?: string;
  awbCode: string;
  courierName: string;
  courierId: number;
  labelUrl: string;
  trackingLink: string;
  is_simulated?: boolean;
  message?: string;
  pickupScheduled?: boolean;
  pickupMessage?: string;
}

export function isPlaceholderShiprocketAwb(awb?: string | null): boolean {
  const value = String(awb || "").trim();
  if (!value) return true;
  return /^AWB\d+$/i.test(value) || /^SR\d+IN$/i.test(value) || value.toLowerCase().includes("demo");
}

function normalizeIndianPhone(phone: string | number | undefined): string {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return digits || "9999999999";
}

function shiprocketErrorMessage(payload: any, fallback: string): string {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;
  const nested =
    payload.response?.data?.awb_assign_error ||
    payload.response?.awb_assign_error ||
    payload.data?.awb_assign_error ||
    payload.awb_assign_error ||
    payload.message ||
    payload.error ||
    payload.errors;
  if (typeof nested === "string" && nested.trim()) return nested;
  if (Array.isArray(nested) && nested.length) return nested.map(String).join(", ");
  if (nested && typeof nested === "object") {
    try {
      return JSON.stringify(nested);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function unwrapAwbAssignPayload(awbData: any): Record<string, any> {
  const candidates = [
    awbData,
    awbData?.response,
    awbData?.response?.data,
    awbData?.data,
    awbData?.data?.data,
  ];
  for (const candidate of candidates) {
    const obj = Array.isArray(candidate) ? candidate[0] : candidate;
    if (obj && (obj.awb_code || obj.awb_number || obj.courier_name)) {
      return obj;
    }
  }
  const last = candidates[2];
  return (Array.isArray(last) ? last[0] : last) || {};
}

function extractPdfUrl(...values: any[]): string {
  for (const value of values) {
    if (typeof value === "string" && /^https?:\/\//i.test(value) && !value.includes("/v1/external/")) {
      return value;
    }
  }
  return "";
}

export interface ShiprocketWebhookPayload {
  awb?: string;
  courier_name?: string;
  current_status?: string;
  current_status_id?: number | string;
  shipment_id?: number | string;
  order_id?: string;
  etd?: string;
  scans?: Array<{
    date?: string;
    activity?: string;
    location?: string;
  }>;
  [key: string]: any;
}

// ─────────────────────────────────────────────────────────────────────────────
// In-Memory Token Cache
// ─────────────────────────────────────────────────────────────────────────────
interface TokenCache {
  token: string;
  expiresAt: number; // Unix timestamp in ms
}

let cachedAuthToken: TokenCache | null = null;

// Shiprocket tokens last 10 days; refresh after 9 days to be safe
const TOKEN_TTL_MS = 9 * 24 * 60 * 60 * 1000;

/**
 * Checks if provided credentials exist and look configured
 */
export function areShiprocketCredentialsConfigured(): boolean {
  const email = process.env.SHIPROCKET_EMAIL?.trim();
  const password = process.env.SHIPROCKET_PASSWORD?.trim();
  return Boolean(
    email &&
      password &&
      email !== "your_email@example.com" &&
      !email.startsWith("REPLACE_")
  );
}

/**
 * Obtain Shiprocket JWT Auth Token.
 * Reads SHIPROCKET_EMAIL & SHIPROCKET_PASSWORD from environment.
 * Reuses cached token if valid.
 */
export async function getShiprocketToken(forceRefresh = false): Promise<string> {
  const now = Date.now();

  if (!forceRefresh && cachedAuthToken && now < cachedAuthToken.expiresAt) {
    return cachedAuthToken.token;
  }

  const email = process.env.SHIPROCKET_EMAIL?.trim();
  const password = process.env.SHIPROCKET_PASSWORD?.trim();

  if (!email || !password) {
    console.warn(
      "[Shiprocket] SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD not configured. Using simulated dev token."
    );
    const mockToken = "mock_shiprocket_token_" + Buffer.from(`${Date.now()}`).toString("base64");
    cachedAuthToken = {
      token: mockToken,
      expiresAt: now + 3600 * 1000,
    };
    return mockToken;
  }

  try {
    const response = await axios.post(
      `${SHIPROCKET_BASE_URL}/auth/login`,
      { email, password },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      }
    );

    if (response.data && response.data.token) {
      const token = response.data.token;
      cachedAuthToken = {
        token,
        expiresAt: now + TOKEN_TTL_MS,
      };
      console.log("[Shiprocket] Successfully authenticated with Shiprocket API");
      return token;
    }

    throw new Error(response.data?.message || "Failed to obtain token from Shiprocket");
  } catch (error: any) {
    const errorMsg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Shiprocket authentication error";

    console.warn(`[Shiprocket] Authentication failed: ${errorMsg}. Falling back to dev simulation mode.`);

    // If in development, return a mock token so dev UI is fully functional
    if (process.env.NODE_ENV !== "production" || !areShiprocketCredentialsConfigured()) {
      const mockToken = "mock_shiprocket_token_fallback_" + Date.now();
      cachedAuthToken = {
        token: mockToken,
        expiresAt: now + 3600 * 1000,
      };
      return mockToken;
    }

    throw new Error(`Shiprocket Auth Error: ${errorMsg}`);
  }
}

/**
 * Clear cached token (useful if an API call encounters 401 Unauthorized)
 */
export function invalidateShiprocketToken() {
  cachedAuthToken = null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Simulated Couriers (Used in dev/test when Shiprocket credentials are dummy/offline)
// ─────────────────────────────────────────────────────────────────────────────
function getSimulatedCouriers(
  pickup: string,
  delivery: string,
  cod: 0 | 1,
  weight: number
): CourierOption[] {
  const baseWeightFactor = Math.max(1, Math.ceil(weight / 0.5));
  const codSurcharge = cod === 1 ? 25 : 0;

  const mockList: CourierOption[] = [
    {
      courier_id: 1001,
      courier_name: "Delhivery Surface",
      rate: Math.round(42 * baseWeightFactor + codSurcharge),
      estimated_days: "3-4 days",
      rating: 4.5,
      cod_charges: codSurcharge,
      min_weight: 0.5,
      is_cheapest: true,
      is_fastest: false,
    },
    {
      courier_id: 1002,
      courier_name: "BlueDart Air Express",
      rate: Math.round(75 * baseWeightFactor + codSurcharge),
      estimated_days: "1-2 days",
      rating: 4.8,
      cod_charges: codSurcharge,
      min_weight: 0.5,
      is_cheapest: false,
      is_fastest: true,
    },
    {
      courier_id: 1003,
      courier_name: "DTDC Surface Standard",
      rate: Math.round(48 * baseWeightFactor + codSurcharge),
      estimated_days: "4-5 days",
      rating: 4.1,
      cod_charges: codSurcharge,
      min_weight: 0.5,
      is_cheapest: false,
      is_fastest: false,
    },
    {
      courier_id: 1004,
      courier_name: "Xpressbees Surface",
      rate: Math.round(45 * baseWeightFactor + codSurcharge),
      estimated_days: "3-4 days",
      rating: 4.3,
      cod_charges: codSurcharge,
      min_weight: 0.5,
      is_cheapest: false,
      is_fastest: false,
    },
    {
      courier_id: 1005,
      courier_name: "Shadowfax Local Priority",
      rate: Math.round(55 * baseWeightFactor + codSurcharge),
      estimated_days: "2-3 days",
      rating: 4.2,
      cod_charges: codSurcharge,
      min_weight: 0.5,
      is_cheapest: false,
      is_fastest: false,
    },
  ];

  return mockList;
}

/**
 * Check Courier Serviceability & Rates between two pincodes
 */
export async function checkServiceability(
  params: ServiceabilityParams
): Promise<ServiceabilityResult> {
  const pickup = String(params.pickup_postcode).trim();
  const delivery = String(params.delivery_postcode).trim();
  const cod = params.cod === 1 ? 1 : 0;
  const weight = Number(params.weight) || 0.2;

  // Validate pincodes (6 digits)
  if (!/^\d{6}$/.test(pickup)) {
    throw new Error("Invalid pickup pincode: must be a 6-digit number");
  }
  if (!/^\d{6}$/.test(delivery)) {
    throw new Error("Invalid delivery pincode: must be a 6-digit number");
  }

  const token = await getShiprocketToken();
  const isMock = token.startsWith("mock_");

  if (isMock) {
    const couriers = getSimulatedCouriers(pickup, delivery, cod, weight);
    return {
      success: true,
      couriers,
      cheapest_courier_id: 1001,
      fastest_courier_id: 1002,
      recommended_courier_id: 1001,
      is_simulated: true,
      message: "Showing simulated courier rates (Shiprocket test mode)",
    };
  }

  try {
    const response = await axios.get(
      `${SHIPROCKET_BASE_URL}/courier/serviceability/`,
      {
        params: {
          pickup_postcode: pickup,
          delivery_postcode: delivery,
          cod,
          weight,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 12000,
      }
    );

    const data = response.data?.data;
    const rawCouriers: any[] =
      data?.available_courier_companies ||
      data?.available_courier_companies_surface ||
      [];

    if (!rawCouriers || rawCouriers.length === 0) {
      return {
        success: false,
        couriers: [],
        message: "No couriers available for this route and weight combination.",
      };
    }

    // Map and extract relevant courier fields
    let couriers: CourierOption[] = rawCouriers.map((c) => {
      const rate = Number(c.rate || c.freight_charge || 0);
      const estDays =
        c.etd ||
        c.estimated_delivery_days ||
        (c.delivery_time ? `${c.delivery_time} days` : "3-5 days");

      return {
        courier_id: Number(c.courier_company_id || c.id),
        courier_name: c.courier_name || c.city || "Courier Partner",
        rate: Math.round(rate),
        estimated_days: estDays,
        rating: Number(c.rating || 4.0),
        cod_charges: Number(c.cod_charges || 0),
        min_weight: Number(c.min_weight || 0.5),
      };
    });

    // Determine cheapest and fastest
    if (couriers.length > 0) {
      let minRate = Infinity;
      let minRateId = couriers[0].courier_id;

      let minDays = Infinity;
      let minDaysId = couriers[0].courier_id;

      couriers.forEach((c) => {
        if (c.rate < minRate) {
          minRate = c.rate;
          minRateId = c.courier_id;
        }

        // Parse numerical days out of estimated_days
        const daysMatch = String(c.estimated_days).match(/\d+/);
        const parsedDays = daysMatch ? parseInt(daysMatch[0], 10) : 5;
        if (parsedDays < minDays) {
          minDays = parsedDays;
          minDaysId = c.courier_id;
        }
      });

      couriers = couriers.map((c) => ({
        ...c,
        is_cheapest: c.courier_id === minRateId,
        is_fastest: c.courier_id === minDaysId,
      }));

      // Sort with cheapest and fastest first
      couriers.sort((a, b) => {
        if (a.is_cheapest) return -1;
        if (b.is_cheapest) return 1;
        if (a.is_fastest) return -1;
        if (b.is_fastest) return 1;
        return a.rate - b.rate;
      });

      return {
        success: true,
        couriers,
        cheapest_courier_id: minRateId,
        fastest_courier_id: minDaysId,
        recommended_courier_id: data?.recommended_courier_company_id || minRateId,
        is_simulated: false,
      };
    }

    return {
      success: false,
      couriers: [],
      message: "No eligible couriers returned by Shiprocket",
    };
  } catch (error: any) {
    if (error.response?.status === 401) {
      invalidateShiprocketToken();
    }

    console.warn("[Shiprocket] Serviceability API error:", error.response?.data || error.message);

    // Provide friendly fallback simulation in non-prod
    if (process.env.NODE_ENV !== "production") {
      const couriers = getSimulatedCouriers(pickup, delivery, cod, weight);
      return {
        success: true,
        couriers,
        cheapest_courier_id: 1001,
        fastest_courier_id: 1002,
        recommended_courier_id: 1001,
        is_simulated: true,
        message: "Live API failed; using simulated courier options for testing.",
      };
    }

    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to check courier serviceability with Shiprocket."
    );
  }
}

/**
 * Format order date to YYYY-MM-DD HH:mm for Shiprocket
 */
function formatShiprocketDate(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

/**
 * Retrieve registered pickup locations from Shiprocket
 */
export async function getRegisteredPickupLocations(token: string): Promise<string[]> {
  try {
    const res = await axios.get(`${SHIPROCKET_BASE_URL}/settings/company/pickup`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    });
    const addresses = res.data?.data?.shipping_address || [];
    return addresses.map((a: any) => a.pickup_location).filter(Boolean);
  } catch (err: any) {
    console.warn("[Shiprocket] Could not fetch pickup locations:", err.message);
    return [];
  }
}

async function shiprocketRequest<T = any>(
  token: string,
  method: "get" | "post",
  path: string,
  data?: any,
  retried = false
): Promise<T> {
  try {
    const res = await axios({
      method,
      url: `${SHIPROCKET_BASE_URL}${path}`,
      data: method === "post" ? data : undefined,
      params: method === "get" ? data : undefined,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      timeout: 20000,
    });
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 401 && !retried) {
      invalidateShiprocketToken();
      const freshToken = await getShiprocketToken(true);
      return shiprocketRequest(freshToken, method, path, data, true);
    }
    throw err;
  }
}

async function fetchShiprocketOrderDetails(token: string, shiprocketOrderId: string | number) {
  try {
    return await shiprocketRequest(token, "get", `/orders/show/${shiprocketOrderId}`);
  } catch (err: any) {
    console.warn("[Shiprocket] Could not fetch order details:", err.response?.data || err.message);
    return null;
  }
}

function detailsToAwb(details: any): { awbCode?: string; courierName?: string; shipmentId?: string } {
  const data = details?.data || details;
  const shipment = Array.isArray(data?.shipments) ? data.shipments[0] : data?.shipments;
  const awbCode =
    data?.awb ||
    data?.awb_code ||
    shipment?.awb ||
    shipment?.awb_code;
  const courierName = data?.courier || data?.courier_name || shipment?.courier || shipment?.courier_name;
  const shipmentId = data?.shipment_id || shipment?.id || shipment?.shipment_id;
  return {
    awbCode: awbCode ? String(awbCode) : undefined,
    courierName: courierName ? String(courierName) : undefined,
    shipmentId: shipmentId ? String(shipmentId) : undefined,
  };
}

async function assignShiprocketAwb(
  token: string,
  shipmentId: number,
  courierId?: number,
  reassign = false
): Promise<{ awbCode: string; courierName: string; courierId: number; raw: any }> {
  const payload: Record<string, any> = { shipment_id: shipmentId };
  if (courierId && Number.isFinite(courierId) && courierId > 0) {
    payload.courier_id = courierId;
  }
  if (reassign) {
    payload.status = "reassign";
  }

  const awbData = await shiprocketRequest(token, "post", "/courier/assign/awb", payload);
  const assignStatus = Number(awbData?.awb_assign_status);
  const parsed = unwrapAwbAssignPayload(awbData);
  const awbCode = String(parsed.awb_code || parsed.awb_number || "").trim();
  const courierName = String(parsed.courier_name || parsed.child_courier_name || "").trim();
  const assignedCourierId = Number(parsed.courier_company_id || parsed.courier_id || courierId || 0);

  if (assignStatus === 0 || !awbCode) {
    throw new Error(
      shiprocketErrorMessage(
        awbData,
        "Shiprocket did not assign an AWB. Check wallet balance, pickup location, and courier serviceability."
      )
    );
  }

  return { awbCode, courierName: courierName || "Assigned Courier", courierId: assignedCourierId, raw: awbData };
}

/**
 * Creates Forward Shipment in Shiprocket:
 * 1. Creates Adhoc Order
 * 2. Assigns AWB with selected courier (fails if Shiprocket does not return awb_code)
 * 3. Schedules courier pickup (required before manifest)
 * 4. Generates Shipping Label PDF
 */
export async function createForwardShipment(
  input: CreateShipmentInput
): Promise<CreateShipmentResult> {
  const token = await getShiprocketToken();
  const isMock = token.startsWith("mock_");

  const weight = Number(input.weight) || 0.2;
  const length = Number(input.length) || 10;
  const breadth = Number(input.breadth) || 10;
  const height = Number(input.height) || 2;
  const courierIdNum = Number(input.courier_id);

  // If in simulation / mock mode:
  if (isMock) {
    const randomAwb = `SR${Math.floor(100000000 + Math.random() * 900000000)}IN`;
    const randomShipmentId = `SHIP${Math.floor(100000 + Math.random() * 900000)}`;

    const courierMap: Record<number, string> = {
      1001: "Delhivery Surface",
      1002: "BlueDart Air Express",
      1003: "DTDC Surface Standard",
      1004: "Xpressbees Surface",
      1005: "Shadowfax Local Priority",
    };
    const courierName = courierMap[courierIdNum] || "Shiprocket Partner Express";

    return {
      success: true,
      shipmentId: randomShipmentId,
      awbCode: randomAwb,
      courierName,
      courierId: courierIdNum,
      labelUrl: `https://shiprocket.co/tracking/label-demo-${randomAwb}.pdf`,
      trackingLink: `https://shiprocket.co/tracking/${randomAwb}`,
      is_simulated: true,
      pickupScheduled: true,
      pickupMessage: "Pickup scheduled in test/simulation mode",
      message: "Shipment generated successfully in test/simulation mode",
    };
  }

  try {
    const isCod =
      String(input.paymentMethod).toUpperCase() === "COD" ||
      String(input.paymentMethod).toLowerCase() === "cod";

    let pickupLocation = (
      process.env.SHIPROCKET_PICKUP_LOCATION ||
      input.pickup_location ||
      "work"
    ).trim();

    const registered = await getRegisteredPickupLocations(token);
    if (registered.length > 0 && !registered.includes(pickupLocation)) {
      console.log(
        `[Shiprocket] Pickup location '${pickupLocation}' not found in registered locations [${registered.join(", ")}]. Using '${registered[0]}'.`
      );
      pickupLocation = registered[0];
    }

    const orderItems =
      input.items && input.items.length > 0
        ? input.items.map((item: any, idx) => ({
            name: item.name || item.title || `Item ${idx + 1}`,
            sku: item.sku || `SKU-${idx + 1}`,
            units: Number(item.units || item.quantity) || 1,
            selling_price: Number(item.selling_price || item.price) || 100,
            discount: Number(item.discount) || 0,
            tax: Number(item.tax) || 0,
            hsn: item.hsn || 0,
          }))
        : [
            {
              name: "Merchandise Item",
              sku: `SKU-${input.orderId}`,
              units: 1,
              selling_price: Number(input.totalPrice) || 100,
              discount: 0,
              tax: 0,
              hsn: 0,
            },
          ];

    const customerName = String(input.customerName || "Customer").trim();
    const nameParts = customerName.split(/\s+/);
    const billingFirstName = nameParts[0] || "Customer";
    const billingLastName = nameParts.slice(1).join(" ") || "";

    const orderRef = input.forceRecreate
      ? `${String(input.orderId).slice(0, 30)}-${Date.now().toString().slice(-8)}`
      : String(input.orderId);

    const orderPayload: Record<string, any> = {
      order_id: orderRef,
      order_date: formatShiprocketDate(),
      pickup_location: pickupLocation,
      comment: "Shipment created from Girlyhub Admin",
      billing_customer_name: billingFirstName,
      billing_last_name: billingLastName,
      billing_address: input.address || "Delivery Address",
      billing_address_2: "",
      billing_city: input.city || "New Delhi",
      billing_pincode: String(input.pincode),
      billing_state: input.state || "Delhi",
      billing_country: "India",
      billing_email: input.email || "support@girlyhub.com",
      billing_phone: normalizeIndianPhone(input.phone),
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: isCod ? "COD" : "Prepaid",
      shipping_charges: 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: Number(input.totalPrice) || 100,
      length,
      breadth,
      height,
      weight,
    };

    console.log("[Shiprocket] Creating adhoc order:", orderRef);
    const orderData = await shiprocketRequest(token, "post", "/orders/create/adhoc", orderPayload);
    const shipmentId = Number(orderData.shipment_id || orderData.data?.shipment_id);
    const srOrderId = orderData.order_id || orderData.data?.order_id;

    if (!shipmentId) {
      throw new Error(
        shiprocketErrorMessage(
          orderData,
          "Failed to obtain shipment_id from Shiprocket create order response."
        )
      );
    }

    console.log(`[Shiprocket] Order created with shipment_id: ${shipmentId}, order_id: ${srOrderId}`);

    let awbCode = "";
    let courierName = "";
    let assignedCourierId = courierIdNum;

    const tryAssign = async (courierId?: number, reassign = false) => {
      const assigned = await assignShiprocketAwb(token, shipmentId, courierId, reassign);
      awbCode = assigned.awbCode;
      courierName = assigned.courierName;
      assignedCourierId = assigned.courierId || courierId || assignedCourierId;
    };

    try {
      await tryAssign(courierIdNum);
    } catch (firstAssignErr: any) {
      console.warn("[Shiprocket] AWB assign with selected courier failed:", firstAssignErr.message);
      try {
        await tryAssign(undefined);
      } catch (recommendedErr: any) {
        console.warn("[Shiprocket] Recommended courier AWB assign failed:", recommendedErr.message);
        const details = srOrderId ? await fetchShiprocketOrderDetails(token, srOrderId) : null;
        const fromDetails = detailsToAwb(details);
        if (fromDetails.awbCode && !isPlaceholderShiprocketAwb(fromDetails.awbCode)) {
          awbCode = fromDetails.awbCode;
          courierName = fromDetails.courierName || courierName;
        } else {
          throw new Error(
            recommendedErr.message ||
              firstAssignErr.message ||
              "Shiprocket AWB assignment failed. Pickup cannot be generated without a live AWB."
          );
        }
      }
    }

    if (!awbCode || isPlaceholderShiprocketAwb(awbCode)) {
      throw new Error(
        "Shiprocket created the order but did not assign a live AWB. Pickup, invoice, and manifest stay disabled until AWB assignment succeeds."
      );
    }

    const pickupResult = await generateShiprocketPickup([shipmentId]);
    let labelUrl = "";
    try {
      labelUrl = await generateShiprocketLabel(shipmentId);
    } catch (labelErr: any) {
      console.warn("[Shiprocket] Label generation notice:", labelErr.message);
    }

    const trackingLink = `https://shiprocket.co/tracking/${awbCode}`;

    return {
      success: true,
      shipmentId: String(shipmentId),
      shiprocketOrderId: srOrderId ? String(srOrderId) : String(shipmentId),
      awbCode,
      courierName: courierName || "Assigned Courier",
      courierId: assignedCourierId,
      labelUrl,
      trackingLink,
      is_simulated: false,
      pickupScheduled: pickupResult.success,
      pickupMessage: pickupResult.message,
      message: pickupResult.success
        ? "Shipment created, AWB assigned, pickup scheduled, and label generated"
        : `Shipment created and AWB assigned, but pickup failed: ${pickupResult.message}`,
    };
  } catch (error: any) {
    if (error.response?.status === 401) {
      invalidateShiprocketToken();
    }

    console.error(
      "[Shiprocket] Create shipment error:",
      error.response?.data || error.message
    );

    const detailedMessage =
      shiprocketErrorMessage(error.response?.data, "") ||
      error.message ||
      "Failed to create forward shipment on Shiprocket";

    throw new Error(detailedMessage);
  }
}

/**
 * Generate or Re-fetch Shipping Label for a given shipmentId
 */
export async function generateShiprocketLabel(shipmentId: string | number): Promise<string> {
  const token = await getShiprocketToken();
  const validNum = Number(shipmentId);

  if (isNaN(validNum) || validNum <= 0) {
    throw new Error("Cannot generate label: Valid numerical Shiprocket shipment ID required.");
  }

  if (token.startsWith("mock_")) {
    return `https://shiprocket.co/tracking/demo-label-${shipmentId}.pdf`;
  }

  const resData = await shiprocketRequest(token, "post", "/courier/generate/label", {
    shipment_id: [validNum],
  });

  const labelUrl = extractPdfUrl(
    resData?.label_url,
    resData?.response?.label_url,
    resData?.payload?.label_url
  );

  if (!labelUrl) {
    throw new Error(
      shiprocketErrorMessage(
        resData,
        "Shiprocket did not return a label PDF URL. Assign a live AWB first, then retry label generation."
      )
    );
  }

  return labelUrl;
}

/**
 * Step 6: Generate Pickup Request
 * POST /v1/external/courier/generate/pickup
 */
export async function generateShiprocketPickup(
  shipmentIds: (string | number)[],
  pickupDate?: string
): Promise<{ success: boolean; message: string; response?: any }> {
  const token = await getShiprocketToken();
  const ids = shipmentIds
    .map((id) => Number(id))
    .filter((n) => !isNaN(n) && n > 0);

  if (ids.length === 0) {
    return {
      success: false,
      message: "No valid numerical Shiprocket shipment ID found. Please book a shipment with Shiprocket first.",
    };
  }

  if (token.startsWith("mock_")) {
    return {
      success: true,
      message: `Pickup scheduled successfully for shipment ${ids.join(", ")} (simulated)`,
      response: { pickup_status: 1, pickup_scheduled_date: pickupDate || new Date().toISOString() },
    };
  }

  const shipmentId = ids[0];
  const payload: Record<string, any> = { shipment_id: [shipmentId] };
  if (pickupDate) {
    payload.pickup_date = [pickupDate];
  }

  const requestPickup = async (body: Record<string, any>) => {
    try {
      return { ok: true as const, data: await shiprocketRequest(token, "post", "/courier/generate/pickup", body) };
    } catch (err: any) {
      return {
        ok: false as const,
        data: err.response?.data,
        message: shiprocketErrorMessage(err.response?.data, err.message || "Failed to schedule pickup"),
      };
    }
  };

  let result = await requestPickup(payload);
  const failedMsg = !result.ok ? result.message : "";
  const needsRetry =
    !result.ok ||
    Number(result.data?.pickup_status) === 0 ||
    Number(result.data?.status_code) >= 400;

  if (needsRetry) {
    result = await requestPickup({ ...payload, status: "retry" });
  }

  const data = result.data || {};
  const responseData = data.response || data;
  const alreadyLaunched = /already/i.test(
    String(data.message || responseData?.message || responseData?.data || "")
  );
  const isSuccess =
    result.ok &&
    (Number(data.pickup_status) === 1 ||
      Number(responseData?.status) === 1 ||
      alreadyLaunched);

  if (!isSuccess) {
    return {
      success: false,
      message:
        failedMsg ||
        shiprocketErrorMessage(
          data,
          "Pickup could not be scheduled. Shiprocket requires a live AWB on this shipment first."
        ),
      response: data,
    };
  }

  return {
    success: true,
    message:
      data.message ||
      responseData?.message ||
      (alreadyLaunched ? "Pickup is already scheduled for this shipment." : "Pickup generated successfully"),
    response: responseData,
  };
}

/**
 * Step 7: Generate Manifest
 * POST /v1/external/manifests/generate
 */
export async function generateShiprocketManifest(
  shipmentIds: (string | number)[]
): Promise<{ success: boolean; message: string; manifest_url?: string; response?: any }> {
  const token = await getShiprocketToken();
  const ids = shipmentIds
    .map((id) => Number(id))
    .filter((n) => !isNaN(n) && n > 0);

  if (ids.length === 0) {
    return {
      success: false,
      message: "No valid numerical Shiprocket shipment ID found. Please book a shipment with Shiprocket first.",
    };
  }

  if (token.startsWith("mock_")) {
    return {
      success: true,
      message: "Manifest generated successfully (simulated)",
      manifest_url: `https://shiprocket.co/manifest-demo-${ids[0]}.pdf`,
    };
  }

  try {
    const res = await axios.post(
      `${SHIPROCKET_BASE_URL}/manifests/generate`,
      { shipment_id: ids },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    const data = res.data;
    return {
      success: true,
      message: data.message || "Manifest generated successfully",
      manifest_url: data.manifest_url,
      response: data,
    };
  } catch (err: any) {
    console.error("[Shiprocket] Error generating manifest:", err.response?.data || err.message);
    return {
      success: false,
      message: err.response?.data?.message || err.message || "Failed to generate manifest",
      response: err.response?.data,
    };
  }
}

/**
 * Step 8: Print Manifest
 * POST /v1/external/manifests/print
 */
export async function printShiprocketManifest(
  shipmentIds: (string | number)[]
): Promise<{ success: boolean; manifest_url: string; message?: string }> {
  const token = await getShiprocketToken();
  const ids = shipmentIds
    .map((id) => Number(id))
    .filter((n) => !isNaN(n) && n > 0);

  if (ids.length === 0) {
    return {
      success: false,
      manifest_url: "",
      message: "No valid numerical Shiprocket shipment ID found. Please book a shipment with Shiprocket first.",
    };
  }

  if (token.startsWith("mock_")) {
    return {
      success: true,
      manifest_url: `https://shiprocket.co/manifest-demo-${ids[0]}.pdf`,
    };
  }

  try {
    const res = await axios.post(
      `${SHIPROCKET_BASE_URL}/manifests/print`,
      { shipment_id: ids },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    const manifestUrl =
      res.data?.manifest_url ||
      res.data?.response?.manifest_url ||
      `https://apiv2.shiprocket.in/v1/external/manifests/print?shipment_id=${ids[0]}`;

    if (!manifestUrl || manifestUrl.includes("NaN")) {
      return {
        success: false,
        manifest_url: "",
        message: res.data?.error?.message || res.data?.message || "No manifest found for this shipment yet.",
      };
    }

    return {
      success: true,
      manifest_url: manifestUrl,
    };
  } catch (err: any) {
    console.error("[Shiprocket] Error printing manifest:", err.response?.data || err.message);
    return {
      success: false,
      manifest_url: "",
      message: err.response?.data?.message || err.message || "Failed to print manifest",
    };
  }
}

/**
 * Step 10: Print Invoice
 * POST /v1/external/orders/print/invoice
 */
export async function printShiprocketInvoice(
  orderIds: (string | number)[]
): Promise<{ success: boolean; invoice_url: string; message?: string }> {
  const token = await getShiprocketToken();
  const ids = orderIds
    .map((id) => Number(id))
    .filter((n) => !isNaN(n) && n > 0);

  if (ids.length === 0) {
    return {
      success: false,
      invoice_url: "",
      message: "No valid numerical Shiprocket order ID found. Please book a shipment with Shiprocket first.",
    };
  }

  if (token.startsWith("mock_")) {
    return {
      success: true,
      invoice_url: `https://shiprocket.co/invoice-demo-${ids[0]}.pdf`,
    };
  }

  try {
    const res = await axios.post(
      `${SHIPROCKET_BASE_URL}/orders/print/invoice`,
      { ids },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    if (res.data && res.data.is_invoice_created === false) {
      return {
        success: false,
        invoice_url: "",
        message: res.data.message || "Shiprocket invoice could not be generated. Ensure an AWB is assigned and the order is active.",
      };
    }

    const invoiceUrl =
      res.data?.invoice_url ||
      res.data?.response?.invoice_url ||
      `https://apiv2.shiprocket.in/v1/external/orders/print/invoice?ids=${ids[0]}`;

    if (!invoiceUrl || invoiceUrl.includes("NaN")) {
      return {
        success: false,
        invoice_url: "",
        message: res.data?.message || "Invoice URL could not be generated.",
      };
    }

    return {
      success: true,
      invoice_url: invoiceUrl,
    };
  } catch (err: any) {
    console.error("[Shiprocket] Error printing invoice:", err.response?.data || err.message);
    return {
      success: false,
      invoice_url: "",
      message: err.response?.data?.message || err.message,
    };
  }
}

/**
 * Track an AWB in real-time
 */
export async function trackShiprocketShipment(awbCode: string): Promise<any> {
  const token = await getShiprocketToken();
  if (token.startsWith("mock_")) {
    return {
      awb_code: awbCode,
      current_status: "IN TRANSIT",
      etd: "2-3 days",
      scans: [
        {
          activity: "Manifested and Dispatched",
          location: "Regional Hub",
          date: new Date().toISOString(),
        },
      ],
      is_simulated: true,
    };
  }

  try {
    const res = await axios.get(
      `${SHIPROCKET_BASE_URL}/courier/track/awb/${awbCode}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      }
    );
    return res.data;
  } catch (err: any) {
    console.error("[Shiprocket] Error tracking AWB:", err.message);
    throw err;
  }
}

/**
 * Process Shiprocket Webhook Payloads
 * Standardizes incoming status into: "shipped" | "delivered" | "cancelled" | "rto"
 */
export function mapShiprocketStatusToInternal(rawStatus?: string): {
  shipmentStatus: "Pending" | "Shipped" | "Delivered" | "Cancelled" | "RTO";
  orderStatus: "shipped" | "delivered" | "cancelled" | "processing";
  note: string;
} {
  const s = (rawStatus || "").toUpperCase().trim();

  if (s.includes("DELIVERED")) {
    return {
      shipmentStatus: "Delivered",
      orderStatus: "delivered",
      note: `Shiprocket status updated to Delivered (${s})`,
    };
  }

  if (
    s.includes("RTO") ||
    s.includes("RETURN") ||
    s.includes("UNDELIVERED") ||
    s.includes("LOST")
  ) {
    return {
      shipmentStatus: "RTO",
      orderStatus: "cancelled",
      note: `Shiprocket RTO initiated or returned: ${s}`,
    };
  }

  if (s.includes("CANCEL")) {
    return {
      shipmentStatus: "Cancelled",
      orderStatus: "cancelled",
      note: `Shiprocket shipment cancelled: ${s}`,
    };
  }

  if (
    s.includes("SHIPPED") ||
    s.includes("IN TRANSIT") ||
    s.includes("OUT FOR DELIVERY") ||
    s.includes("PICKED UP") ||
    s.includes("REACHED")
  ) {
    return {
      shipmentStatus: "Shipped",
      orderStatus: "shipped",
      note: `Shiprocket tracking update: ${s}`,
    };
  }

  return {
    shipmentStatus: "Pending",
    orderStatus: "processing",
    note: `Shiprocket tracking update: ${s || "Status event"}`,
  };
}
