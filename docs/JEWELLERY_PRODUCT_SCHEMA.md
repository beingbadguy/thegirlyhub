# Jewellery Product Schema

The canonical product model is `models/product.model.ts` and uses `variants[]` for SKU-level pricing and inventory.

## Example

```json
{
  "name": "Rose Gold Zircon Hoop Earrings",
  "slug": "rose-gold-zircon-hoop-earrings",
  "shortDescription": "Lightweight zircon hoops for everyday styling.",
  "longDescription": "Polished rose-gold hoops with secure backs, designed for daily wear and gifting.",
  "category": "earrings",
  "subCategory": "hoops",
  "brand": "GirlyHub",
  "tags": ["hoops", "zircon", "daily wear", "gift"],
  "material": "gold-plated",
  "plating": "rose-gold",
  "stoneType": "zircon",
  "color": "rose-gold",
  "occasion": "daily-wear",
  "style": "minimal",
  "gender": "women",
  "setType": "pair",
  "variants": [
    {
      "sku": "GH-EAR-HOOP-RG-001",
      "attributes": { "color": "rose-gold", "size": "medium" },
      "price": 1499,
      "discountedPrice": 899,
      "stock": 24,
      "images": [
        "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/hoops.jpg"
      ],
      "weight": 8.5
    }
  ],
  "costPrice": 420,
  "sellingPrice": 899,
  "discountPercentage": 40,
  "currency": "INR",
  "mainImage": "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/hoops.jpg",
  "images": [
    "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/hoops.jpg"
  ],
  "totalStock": 24,
  "lowStockThreshold": 5,
  "trackInventory": true,
  "weight": 8.5,
  "dimensions": { "length": 3, "breadth": 1.5, "height": 3 },
  "metaTitle": "Rose Gold Zircon Hoop Earrings | GirlyHub",
  "metaDescription": "Shop lightweight rose-gold zircon hoop earrings for everyday wear.",
  "averageRating": 4.8,
  "totalReviews": 126,
  "status": "active",
  "isFeatured": true,
  "isNewArrival": true
}
```

## Design notes

- `slug` is the SEO lookup boundary and `variants.sku` is unique across products.
- Variant price, stock, images, and weight stay together so a product read does not require a second collection.
- `tags`, category/status, featured/new-arrival, rating, and text indexes support common catalogue queries.
- `lean()` can be used directly because the read model is flat, with only bounded variant and review arrays.
- Legacy aliases (`title`, `image`, `price`, `discountedPrice`, `countInStock`) are synchronized during document validation so existing cart and checkout code remains compatible.
- `costPrice` should be restricted to admin responses and should not be selected for public catalogue queries.
- For existing MongoDB data, backfill `slug`, `name`, `mainImage`, `sellingPrice`, and `status` before making the unique indexes active.
