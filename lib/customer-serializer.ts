export function serializeCustomer(userDoc: any, ordersList?: any[]) {
  const u = typeof userDoc?.toObject === "function" ? userDoc.toObject() : userDoc;
  const idStr = String(u._id || u.id || "");
  const name = u.name || "Customer";
  const email = u.email || "";
  const phone = u.phone ? String(u.phone) : "";

  // Derive avatar color deterministically from user ID / name
  const avatarPalette = [
    "#fce7ee",
    "#e0f2fe",
    "#fef3c7",
    "#dcfce7",
    "#f3e8ff",
    "#ffedd5",
  ];
  let charCodeSum = 0;
  for (let i = 0; i < (name.length || idStr.length); i++) {
    charCodeSum += (name || idStr).charCodeAt(i);
  }
  const avatarColor = avatarPalette[charCodeSum % avatarPalette.length];

  // Cart parsing
  const rawCart = Array.isArray(u.cart) ? u.cart : (u.cart?.products ? [u.cart] : []);
  const cart: any[] = [];
  rawCart.forEach((cartEntry: any) => {
    const products = Array.isArray(cartEntry?.products)
      ? cartEntry.products
      : Array.isArray(cartEntry)
        ? cartEntry
        : [];
    products.forEach((p: any) => {
      const prod = p.productId || p.product || p;
      if (prod) {
        cart.push({
          productId: String(prod._id || prod.id || p.productId || ""),
          title: prod.title || prod.name || "Product",
          price: Number(prod.discountedPrice ?? prod.discountPrice ?? prod.sellingPrice ?? prod.price ?? 0),
          originalPrice: Number(prod.price ?? prod.originalPrice ?? 0),
          quantity: Number(p.quantity || 1),
          image: prod.mainImage || prod.image || (Array.isArray(prod.images) ? prod.images[0] : "") || "",
          category: prod.category || "Jewellery",
          inStock: Number(prod.countInStock ?? prod.stock ?? prod.totalStock ?? 1) > 0,
          addedAt: cartEntry.createdAt || u.updatedAt || new Date().toISOString(),
        });
      }
    });
  });

  // Wishlist parsing
  const rawWishlist = Array.isArray(u.wishlist) ? u.wishlist : (u.wishlist?.products ? [u.wishlist] : []);
  const wishlist: any[] = [];
  rawWishlist.forEach((wishlistEntry: any) => {
    const products = Array.isArray(wishlistEntry?.products)
      ? wishlistEntry.products
      : Array.isArray(wishlistEntry)
        ? wishlistEntry
        : [];
    products.forEach((p: any) => {
      const prod = p.productId || p.product || p;
      if (prod) {
        wishlist.push({
          productId: String(prod._id || prod.id || p.productId || ""),
          title: prod.title || prod.name || "Product",
          price: Number(prod.discountedPrice ?? prod.discountPrice ?? prod.sellingPrice ?? prod.price ?? 0),
          originalPrice: Number(prod.price ?? prod.originalPrice ?? 0),
          image: prod.mainImage || prod.image || (Array.isArray(prod.images) ? prod.images[0] : "") || "",
          category: prod.category || "Jewellery",
          inStock: Number(prod.countInStock ?? prod.stock ?? prod.totalStock ?? 1) > 0,
          addedAt: wishlistEntry.createdAt || u.updatedAt || new Date().toISOString(),
        });
      }
    });
  });

  // Orders parsing
  const allOrders = ordersList || (Array.isArray(u.order) ? u.order : []);
  const orders = allOrders.map((o: any) => {
    const itemsCount = Array.isArray(o.products)
      ? o.products.reduce((sum: number, item: any) => sum + Number(item.quantity || 1), 0)
      : 1;

    return {
      id: String(o._id || o.id || ""),
      customer: o.recipientName || name,
      email: o.email || email,
      date: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
      total: Number(o.totalAmount ?? o.total ?? 0),
      status: o.status || "processing",
      items: itemsCount,
      payment: o.paymentMethod === "online" ? "Online" : "COD",
      delivery: o.deliveryType === "fast" ? "Express" : "Standard",
      raw: o,
    };
  });

  // Metric aggregates
  const validOrders = orders.filter((o: any) => o.status !== "cancelled");
  const totalSpent = validOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
  const orderCount = orders.length;
  const avgOrderValue = validOrders.length > 0 ? Math.round(totalSpent / validOrders.length) : 0;
  const cartCount = cart.reduce((sum: number, c: any) => sum + Number(c.quantity || 1), 0);
  const wishlistCount = wishlist.length;

  // Addresses parsing
  const addresses: any[] = Array.isArray(u.addresses) && u.addresses.length > 0
    ? u.addresses
    : [
        {
          id: `addr_${idStr || "default"}`,
          type: "shipping",
          isDefault: true,
          name: name,
          phone: phone || "+91 98000 00000",
          street: u.address || "100ft Luxury Road",
          city: u.city || "Mumbai",
          state: u.state || "Maharashtra",
          postalCode: String(u.postalCode || u.zip || "400050"),
          country: u.country || "India",
          landmark: u.landmark || "",
        },
      ];

  // Activity logs
  const baseLogs = Array.isArray(u.activityLogs) ? u.activityLogs : [];
  const activityLogs = baseLogs.map((log: any, idx: number) => ({
    id: log.id || `act_${idx}_${Date.now()}`,
    action: log.action || "Activity Recorded",
    description: log.description || "",
    timestamp: log.timestamp ? new Date(log.timestamp).toISOString() : new Date().toISOString(),
    ipAddress: log.ipAddress,
    device: log.device,
  }));

  if (activityLogs.length === 0) {
    activityLogs.push({
      id: `act_init_${idStr}`,
      action: "Account Registered",
      description: `Customer account registered via ${u.authProvider || "online checkout"}.`,
      timestamp: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
    });
  }

  const role = u.role === "admin" ? "admin" : u.role === "vip" ? "vip" : "customer";
  const status = u.status || "active";
  const isVerified = Boolean(u.isVerified ?? u.verified ?? false);

  return {
    id: idStr,
    name,
    email,
    phone,
    avatarColor,
    verified: isVerified,
    isVerified,
    role,
    status,
    totalSpent,
    orderCount,
    cartCount,
    wishlistCount,
    avgOrderValue,
    lastActive: u.updatedAt ? new Date(u.updatedAt).toISOString() : new Date().toISOString(),
    createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
    tags: Array.isArray(u.tags) ? u.tags : [],
    addresses,
    cart,
    wishlist,
    orders,
    notes: Array.isArray(u.notes) ? u.notes : [],
    activityLogs,
  };
}
