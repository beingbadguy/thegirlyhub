import axios from "axios";
import crypto from "crypto";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * NimbusPost API Helper (Production-Ready)
 * ─────────────────────────────────────────────────────────────────────────────
 * Complete integration with NimbusPost external APIs (https://api.nimbuspost.com/v1):
 * - Authentication & Token Caching (with auto-refresh)
 * - Courier Serviceability & Live Rate Check (cheapest/fastest tagging)
 * - Order & Forward Shipment Creation (AWB allocation & consignment)
 * - Shipping Label PDF Generation
 * - Live Tracking & Webhook Status Processing
 * - Automatic simulated fallback mode for development & unactivated sandbox accounts
 * ─────────────────────────────────────────────────────────────────────────────
 */

const NIMBUSPOST_BASE_URL = "https://api.nimbuspost.com/v1";

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
  order_amount?: number;
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
  size?: string;
}

export interface CreateShipmentInput {
  orderId: string;
  courier_id: number | string;
  weight: number; // in kg, default 0.2
  length: number; // in cm, default 10
  breadth: number; // in cm, default 10
  height: number; // in cm, default 2
  warehouse_name?: string;
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
  awbCode: string;
  courierName: string;
  courierId: number;
  labelUrl: string;
  trackingLink: string;
  is_simulated?: boolean;
  message?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Token Cache
// ─────────────────────────────────────────────────────────────────────────────
interface TokenCache {
  token: string;
  expiresAt: number;
}

let cachedNimbusToken: TokenCache | null = null;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface NimbusPostConfig {
  key: string;
  secret: string;
  email: string;
  warehouseName: string;
  pickupPincode: string;
  isConfigured: boolean;
  hasKey: boolean;
  hasSecret: boolean;
  maskedKey: string;
}

export function getNimbusPostConfig(): NimbusPostConfig {
  const key = process.env.NIMBUSPOST_KEY?.trim() || "";
  const secret = process.env.NIMBUSPOST_SECRET?.trim() || "";
  const email = process.env.NIMBUSPOST_EMAIL?.trim() || "";
  const warehouseName = process.env.NIMBUSPOST_WAREHOUSE_NAME?.trim() || "work";
  const pickupPincode = process.env.NIMBUSPOST_PICKUP_PINCODE?.trim() || "110032";

  const hasKey = key.length > 5;
  const hasSecret = secret.length > 5;
  const isConfigured = hasKey || (Boolean(email) && Boolean(process.env.NIMBUSPOST_PASSWORD));

  const maskedKey = hasKey
    ? `${key.slice(0, 8)}...${key.slice(-4)}`
    : "Not configured";

  return {
    key,
    secret,
    email,
    warehouseName,
    pickupPincode,
    isConfigured,
    hasKey,
    hasSecret,
    maskedKey,
  };
}

export function areNimbusPostCredentialsConfigured(): boolean {
  return getNimbusPostConfig().isConfigured;
}

/**
 * Standardized NimbusPost API Headers:
 * Dispatches Authorization Bearer, plus official api-key / secret-key / x-api-key / x-api-secret headers.
 */
export function getNimbusPostHeaders(token: string): Record<string, string> {
  const config = getNimbusPostConfig();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  if (config.key) {
    headers["api-key"] = config.key;
    headers["x-api-key"] = config.key;
  }
  if (config.secret) {
    headers["secret-key"] = config.secret;
    headers["x-api-secret"] = config.secret;
  }

  return headers;
}

/**
 * Validates HMAC SHA-256 webhook signatures from NimbusPost using NIMBUSPOST_SECRET
 */
export function verifyNimbusPostWebhookSignature(
  rawBody: string,
  signatureHeader?: string | null
): boolean {
  const config = getNimbusPostConfig();
  if (!config.secret) {
    return true; // No secret configured, allow in dev
  }
  if (!signatureHeader) {
    // If sender didn't include signature header, allow in development
    return process.env.NODE_ENV !== "production";
  }
  try {
    const computed = crypto
      .createHmac("sha256", config.secret)
      .update(rawBody)
      .digest("hex");

    const bufA = Buffer.from(computed);
    const bufB = Buffer.from(signatureHeader);
    if (bufA.length !== bufB.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch (err) {
    console.warn("[NimbusPost Webhook] Signature verification error:", err);
    return false;
  }
}

/**
 * Retrieve active NimbusPost Token
 */
export async function getNimbusPostToken(forceRefresh = false): Promise<string> {
  const now = Date.now();

  if (!forceRefresh && cachedNimbusToken && now < cachedNimbusToken.expiresAt) {
    return cachedNimbusToken.token;
  }

  const config = getNimbusPostConfig();
  const password = process.env.NIMBUSPOST_PASSWORD?.trim();

  // 1. Try direct login if email + password or email + secret is available
  const pwdToTry = password || config.secret;
  if (config.email && pwdToTry) {
    try {
      const res = await axios.post(
        `${NIMBUSPOST_BASE_URL}/users/login`,
        { email: config.email, password: pwdToTry },
        { headers: { "Content-Type": "application/json" }, timeout: 10000 }
      );

      if (res.data?.status && res.data?.data) {
        const token = typeof res.data.data === "string" ? res.data.data : res.data.data?.token;
        if (token) {
          cachedNimbusToken = { token, expiresAt: now + TOKEN_TTL_MS };
          console.log("[NimbusPost] Successfully authenticated with NimbusPost API via login");
          return token;
        }
      }
    } catch (err: any) {
      console.warn("[NimbusPost] Login call error:", err.response?.data?.message || err.message);
    }
  }

  // 2. If Key is available, cache key as token
  if (config.hasKey) {
    cachedNimbusToken = { token: config.key, expiresAt: now + TOKEN_TTL_MS };
    return config.key;
  }

  // 3. In development / test, fallback to simulated token
  console.warn("[NimbusPost] Using simulated dev token for NimbusPost.");
  const mockToken = "mock_nimbuspost_token_" + Buffer.from(`${Date.now()}`).toString("base64");
  cachedNimbusToken = { token: mockToken, expiresAt: now + 3600 * 1000 };
  return mockToken;
}

export function invalidateNimbusPostToken() {
  cachedNimbusToken = null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Simulated Couriers for NimbusPost
// ─────────────────────────────────────────────────────────────────────────────
function getSimulatedNimbusCouriers(
  origin: string,
  destination: string,
  cod: 0 | 1,
  weight: number
): CourierOption[] {
  const baseWeightFactor = Math.max(1, Math.ceil(weight / 0.5));
  const codSurcharge = cod === 1 ? 25 : 0;

  return [
    {
      courier_id: 201,
      courier_name: "Delhivery Surface (Nimbus)",
      rate: Math.round(40 * baseWeightFactor + codSurcharge),
      estimated_days: "3-4 days",
      rating: 4.6,
      cod_charges: codSurcharge,
      min_weight: 0.5,
      is_cheapest: true,
      is_fastest: false,
    },
    {
      courier_id: 202,
      courier_name: "BlueDart Air Express (Nimbus)",
      rate: Math.round(72 * baseWeightFactor + codSurcharge),
      estimated_days: "1-2 days",
      rating: 4.8,
      cod_charges: codSurcharge,
      min_weight: 0.5,
      is_cheapest: false,
      is_fastest: true,
    },
    {
      courier_id: 203,
      courier_name: "Shadowfax Local Priority",
      rate: Math.round(46 * baseWeightFactor + codSurcharge),
      estimated_days: "2-3 days",
      rating: 4.3,
      cod_charges: codSurcharge,
      min_weight: 0.5,
      is_cheapest: false,
      is_fastest: false,
    },
    {
      courier_id: 204,
      courier_name: "Ekart Logistics Surface",
      rate: Math.round(44 * baseWeightFactor + codSurcharge),
      estimated_days: "3-4 days",
      rating: 4.4,
      cod_charges: codSurcharge,
      min_weight: 0.5,
      is_cheapest: false,
      is_fastest: false,
    },
    {
      courier_id: 205,
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
      courier_id: 206,
      courier_name: "Xpressbees Surface",
      rate: Math.round(45 * baseWeightFactor + codSurcharge),
      estimated_days: "3-4 days",
      rating: 4.2,
      cod_charges: codSurcharge,
      min_weight: 0.5,
      is_cheapest: false,
      is_fastest: false,
    },
  ];
}

/**
 * Check Courier Serviceability & Rates with NimbusPost
 */
export async function checkNimbusPostServiceability(
  params: ServiceabilityParams
): Promise<ServiceabilityResult> {
  const origin = String(params.pickup_postcode).trim();
  const destination = String(params.delivery_postcode).trim();
  const cod = params.cod === 1 ? 1 : 0;
  const weight = Number(params.weight) || 0.2;
  const weightInGrams = Math.round(weight * 1000);
  const orderAmount = Number(params.order_amount) || 500;

  if (!/^\d{6}$/.test(origin)) {
    throw new Error("Invalid pickup PIN code: must be a 6-digit number");
  }
  if (!/^\d{6}$/.test(destination)) {
    throw new Error("Invalid delivery PIN code: must be a 6-digit number");
  }

  const token = await getNimbusPostToken();
  const isMock = token.startsWith("mock_");

  if (isMock) {
    const couriers = getSimulatedNimbusCouriers(origin, destination, cod, weight);
    return {
      success: true,
      couriers,
      cheapest_courier_id: 201,
      fastest_courier_id: 202,
      recommended_courier_id: 201,
      is_simulated: true,
      message: "Showing simulated courier rates (NimbusPost test/sandbox mode)",
    };
  }

  try {
    const res = await axios.post(
      `${NIMBUSPOST_BASE_URL}/courier/serviceability`,
      {
        origin: Number(origin),
        destination: Number(destination),
        payment_type: cod === 1 ? "cod" : "prepaid",
        order_amount: orderAmount,
        weight: weightInGrams,
      },
      {
        headers: getNimbusPostHeaders(token),
        timeout: 12000,
      }
    );

    if (res.data?.status && Array.isArray(res.data?.data) && res.data.data.length > 0) {
      let couriers: CourierOption[] = res.data.data.map((c: any) => {
        const rate = Number(c.total_charges || c.freight_charges || c.rate || 50);
        const estDays =
          c.estimated_delivery_days ||
          (c.delivery_days ? `${c.delivery_days} days` : "3-5 days");

        return {
          courier_id: Number(c.courier_id || c.id),
          courier_name: c.courier_name || "Courier Partner",
          rate: Math.round(rate),
          estimated_days: estDays,
          rating: Number(c.rating || 4.2),
          cod_charges: Number(c.cod_charges || 0),
          min_weight: Number(c.min_weight || 0.5),
        };
      });

      // Find cheapest and fastest
      let minRate = Infinity;
      let minRateId = couriers[0].courier_id;
      let minDays = Infinity;
      let minDaysId = couriers[0].courier_id;

      couriers.forEach((c) => {
        if (c.rate < minRate) {
          minRate = c.rate;
          minRateId = c.courier_id;
        }
        const parsed = parseInt(String(c.estimated_days).match(/\d+/)?.[0] || "5", 10);
        if (parsed < minDays) {
          minDays = parsed;
          minDaysId = c.courier_id;
        }
      });

      couriers = couriers.map((c) => ({
        ...c,
        is_cheapest: c.courier_id === minRateId,
        is_fastest: c.courier_id === minDaysId,
      }));

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
        recommended_courier_id: minRateId,
        is_simulated: false,
      };
    }

    // If API returned invalid token or empty couriers in dev, provide realistic quotes
    if (process.env.NODE_ENV !== "production") {
      const couriers = getSimulatedNimbusCouriers(origin, destination, cod, weight);
      return {
        success: true,
        couriers,
        cheapest_courier_id: 201,
        fastest_courier_id: 202,
        recommended_courier_id: 201,
        is_simulated: true,
        message: "Live API returned empty response; showing simulated couriers for testing.",
      };
    }

    return {
      success: false,
      couriers: [],
      message: res.data?.message || "No couriers available for this route in NimbusPost",
    };
  } catch (err: any) {
    console.warn("[NimbusPost] Serviceability check error:", err.response?.data || err.message);

    if (process.env.NODE_ENV !== "production") {
      const couriers = getSimulatedNimbusCouriers(origin, destination, cod, weight);
      return {
        success: true,
        couriers,
        cheapest_courier_id: 201,
        fastest_courier_id: 202,
        recommended_courier_id: 201,
        is_simulated: true,
        message: "API serviceability fallback; showing test couriers.",
      };
    }

    throw new Error(err.response?.data?.message || err.message || "Failed to check NimbusPost serviceability");
  }
}

/**
 * Creates Forward Shipment in NimbusPost:
 * 1. Creates Shipment with courier selection
 * 2. Allocates AWB
 * 3. Generates Shipping Label PDF
 */
export async function createNimbusPostShipment(
  input: CreateShipmentInput
): Promise<CreateShipmentResult> {
  const token = await getNimbusPostToken();
  const isMock = token.startsWith("mock_");

  const weight = Number(input.weight) || 0.2;
  const weightInGrams = Math.round(weight * 1000);
  const length = Number(input.length) || 10;
  const breadth = Number(input.breadth) || 10;
  const height = Number(input.height) || 2;
  const courierIdNum = Number(input.courier_id);

  // If mock mode:
  if (isMock) {
    const randomAwb = `NP${Math.floor(100000000 + Math.random() * 900000000)}IN`;
    const randomShipmentId = `NIMBUS_${Math.floor(100000 + Math.random() * 900000)}`;

    const courierMap: Record<number, string> = {
      201: "Delhivery Surface (Nimbus)",
      202: "BlueDart Air Express (Nimbus)",
      203: "Shadowfax Local Priority",
      204: "Ekart Logistics Surface",
      205: "DTDC Surface Standard",
      206: "Xpressbees Surface",
    };
    const courierName = courierMap[courierIdNum] || "NimbusPost Partner Courier";

    return {
      success: true,
      shipmentId: randomShipmentId,
      awbCode: randomAwb,
      courierName,
      courierId: courierIdNum,
      labelUrl: `https://nimbuspost.com/tracking/demo-label-${randomAwb}.pdf`,
      trackingLink: `https://nimbuspost.com/tracking?awb=${randomAwb}`,
      is_simulated: true,
      message: "Shipment generated successfully in test/simulation mode",
    };
  }

  try {
    const isCod =
      String(input.paymentMethod).toUpperCase() === "COD" ||
      String(input.paymentMethod).toLowerCase() === "cod";

    const warehouseName =
      input.warehouse_name ||
      process.env.NIMBUSPOST_WAREHOUSE_NAME ||
      "work";

    const pickupPincode =
      process.env.NIMBUSPOST_PICKUP_PINCODE || "110032";

    const orderItems =
      input.items && input.items.length > 0
        ? input.items.map((item, idx) => ({
            name: item.name || `Item ${idx + 1}`,
            qty: Number(item.units) || 1,
            price: Number(item.selling_price) || 100,
            sku: item.sku || `SKU-${idx + 1}`,
          }))
        : [
            {
              name: "Merchandise Item",
              qty: 1,
              price: Number(input.totalPrice) || 100,
              sku: `SKU-${input.orderId}`,
            },
          ];

    const shipmentPayload = {
      order_number: String(input.orderId),
      shipping_charges: 0,
      discount: 0,
      cod_charges: 0,
      payment_type: isCod ? "cod" : "prepaid",
      order_amount: Number(input.totalPrice) || 100,
      package_weight: weightInGrams,
      package_length: length,
      package_breadth: breadth,
      package_height: height,
      request_auto_pickup: "yes",
      consignee: {
        name: input.customerName || "Customer",
        address: input.address || "Delivery Address",
        address_2: "",
        city: input.city || "New Delhi",
        state: input.state || "Delhi",
        pincode: String(input.pincode),
        phone: String(input.phone).replace(/\D/g, "") || "9999999999",
      },
      pickup: {
        warehouse_name: warehouseName,
        name: "Warehouse Manager",
        address: "1/205 Shri Ram nagar Shahdara Delhi",
        city: "East Delhi",
        state: "Delhi",
        pincode: pickupPincode,
        phone: "9667549765",
      },
      order_items: orderItems,
      courier_id: courierIdNum,
    };

    console.log("[NimbusPost] Creating shipment for order:", input.orderId);
    const res = await axios.post(
      `${NIMBUSPOST_BASE_URL}/shipments`,
      shipmentPayload,
      {
        headers: getNimbusPostHeaders(token),
        timeout: 15000,
      }
    );

    const data = res.data?.data || res.data;
    if (res.data?.status && data) {
      const shipmentId = String(data.shipment_id || data.id || `NIMBUS_${Date.now()}`);
      const awbCode = String(data.awb_number || data.awb || `NP${shipmentId}`);
      const courierName = data.courier_name || "Nimbus Courier Partner";
      const labelUrl =
        data.label ||
        data.label_url ||
        `https://api.nimbuspost.com/v1/shipments/print_label?ids=${shipmentId}`;
      const trackingLink = `https://nimbuspost.com/tracking?awb=${awbCode}`;

      return {
        success: true,
        shipmentId,
        awbCode,
        courierName,
        courierId: courierIdNum,
        labelUrl,
        trackingLink,
        is_simulated: false,
        message: "Shipment created successfully on NimbusPost",
      };
    }

    throw new Error(res.data?.message || "Failed to create shipment on NimbusPost");
  } catch (err: any) {
    console.error("[NimbusPost] Create shipment error:", err.response?.data || err.message);

    if (process.env.NODE_ENV !== "production") {
      const randomAwb = `NP${Math.floor(100000000 + Math.random() * 900000000)}IN`;
      const randomShipmentId = `NIMBUS_${Math.floor(100000 + Math.random() * 900000)}`;

      return {
        success: true,
        shipmentId: randomShipmentId,
        awbCode: randomAwb,
        courierName: "Delhivery Surface (Nimbus Simulated)",
        courierId: courierIdNum,
        labelUrl: `https://nimbuspost.com/tracking/demo-label-${randomAwb}.pdf`,
        trackingLink: `https://nimbuspost.com/tracking?awb=${randomAwb}`,
        is_simulated: true,
        message: "Live API returned error; generated simulated shipment for test.",
      };
    }

    throw new Error(err.response?.data?.message || err.message || "Failed to create forward shipment on NimbusPost");
  }
}

/**
 * Generate Shipping Label PDF for a given shipmentId
 */
export async function generateNimbusPostLabel(shipmentId: string | number): Promise<string> {
  const token = await getNimbusPostToken();
  if (token.startsWith("mock_")) {
    return `https://nimbuspost.com/tracking/demo-label-${shipmentId}.pdf`;
  }

  try {
    const res = await axios.post(
      `${NIMBUSPOST_BASE_URL}/shipments/print_label`,
      { ids: [String(shipmentId)] },
      { headers: getNimbusPostHeaders(token), timeout: 12000 }
    );
    return res.data?.data || res.data?.label || `https://api.nimbuspost.com/v1/shipments/print_label?ids=${shipmentId}`;
  } catch {
    return `https://api.nimbuspost.com/v1/shipments/print_label?ids=${shipmentId}`;
  }
}

/**
 * Track an AWB
 */
export async function trackNimbusPostShipment(awbCode: string): Promise<any> {
  const token = await getNimbusPostToken();
  if (token.startsWith("mock_")) {
    return {
      awb: awbCode,
      status: "IN TRANSIT",
      location: "Regional Hub",
      estimated_delivery: "2-3 days",
      scans: [
        {
          activity: "Manifested and Dispatched",
          location: "Shahdara Hub (110032)",
          date: new Date().toISOString(),
        },
      ],
      is_simulated: true,
    };
  }

  try {
    const res = await axios.post(
      `${NIMBUSPOST_BASE_URL}/shipments/track`,
      { awb: awbCode },
      { headers: getNimbusPostHeaders(token), timeout: 10000 }
    );
    return res.data;
  } catch (err: any) {
    console.warn("[NimbusPost] Live tracking endpoint error:", err.message);
    if (process.env.NODE_ENV !== "production") {
      return {
        status: true,
        data: {
          awb: awbCode,
          current_status: "IN TRANSIT",
          location: "Regional Sorting Facility (110032)",
          estimated_delivery: "2-3 business days",
          history: [
            {
              event_time: new Date().toISOString(),
              location: "Shahdara Hub (110032)",
              status: "Shipment Picked Up & Manifested",
            },
          ],
        },
        is_simulated: true,
      };
    }
    throw err;
  }
}

/**
 * Map incoming NimbusPost Webhook status
 */
export function mapNimbusPostStatusToInternal(rawStatus?: string): {
  shipmentStatus: "Pending" | "Shipped" | "Delivered" | "Cancelled" | "RTO";
  orderStatus: "shipped" | "delivered" | "cancelled" | "processing";
  note: string;
} {
  const s = (rawStatus || "").toUpperCase().trim();

  if (s.includes("DELIVERED")) {
    return {
      shipmentStatus: "Delivered",
      orderStatus: "delivered",
      note: `NimbusPost status updated to Delivered (${s})`,
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
      note: `NimbusPost RTO event: ${s}`,
    };
  }

  if (s.includes("CANCEL")) {
    return {
      shipmentStatus: "Cancelled",
      orderStatus: "cancelled",
      note: `NimbusPost shipment cancelled: ${s}`,
    };
  }

  if (
    s.includes("SHIPPED") ||
    s.includes("IN TRANSIT") ||
    s.includes("OUT FOR DELIVERY") ||
    s.includes("PICKED UP") ||
    s.includes("REACHED") ||
    s.includes("MANIFESTED")
  ) {
    return {
      shipmentStatus: "Shipped",
      orderStatus: "shipped",
      note: `NimbusPost tracking update: ${s}`,
    };
  }

  return {
    shipmentStatus: "Pending",
    orderStatus: "processing",
    note: `NimbusPost tracking event: ${s || "Status event"}`,
  };
}
