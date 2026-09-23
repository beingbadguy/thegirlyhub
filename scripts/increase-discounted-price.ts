import { databaseConnection } from "../config/databseConnection";
import Product from "../models/product.model";

async function main() {
  const isApply = process.argv.includes("--apply");

  console.log(`\n======================================================`);
  console.log(`   INCREASE DISCOUNTED PRICE BY ₹30 ON ALL PRODUCTS   `);
  console.log(`   Mode: ${isApply ? "🚀 APPLYING CHANGES TO DB" : "👀 DRY RUN (No changes saved)"}`);
  console.log(`======================================================\n`);

  await databaseConnection();
  console.log("Connected to MongoDB successfully.\n");

  const products = await Product.find({});
  console.log(`Found ${products.length} product(s) in database.\n`);

  if (products.length === 0) {
    console.log("No products found to update.");
    process.exit(0);
  }

  let updatedCount = 0;
  const sampleChanges: any[] = [];

  for (const product of products) {
    const currentDiscounted = Number(
      product.discountedPrice ||
        (product as any).sellingPrice ||
        (product as any).discountPrice ||
        product.price ||
        0
    );

    const newDiscounted = currentDiscounted + 30;
    const originalPrice = Number(product.price || 0);
    // Ensure MRP is at least equal to new discounted price
    const newPrice = Math.max(originalPrice, newDiscounted);

    const oldValues = {
      id: product._id.toString(),
      title: (product.title || product.name || "").slice(0, 30),
      oldDiscountedPrice: currentDiscounted,
      newDiscountedPrice: newDiscounted,
      oldPrice: originalPrice,
      newPrice: newPrice,
      variantsCount: product.variants?.length || 0,
    };

    if (sampleChanges.length < 10) {
      sampleChanges.push(oldValues);
    }

    if (isApply) {
      product.discountedPrice = newDiscounted;
      product.sellingPrice = newDiscounted;
      product.discountPrice = newDiscounted;
      product.price = newPrice;

      // Recalculate discount percentage
      if (newPrice > newDiscounted) {
        product.discountPercentage = Math.round(((newPrice - newDiscounted) / newPrice) * 100);
      } else {
        product.discountPercentage = 0;
      }

      // Update variants if any exist
      if (Array.isArray(product.variants) && product.variants.length > 0) {
        product.variants.forEach((v: any) => {
          if (typeof v.discountedPrice === "number" && v.discountedPrice > 0) {
            v.discountedPrice += 30;
            if (v.price && v.price < v.discountedPrice) {
              v.price = v.discountedPrice;
            }
          }
        });
      }

      await product.save();
    }

    updatedCount++;
  }

  console.log("Sample of products to be updated / updated:\n");
  console.table(sampleChanges);

  console.log(`\n------------------------------------------------------`);
  if (isApply) {
    console.log(`✅ Successfully updated ${updatedCount} product(s) with ₹30 increase in discountedPrice!`);
  } else {
    console.log(`ℹ️ Dry run completed for ${updatedCount} product(s). Run with --apply to commit.`);
  }
  console.log(`------------------------------------------------------\n`);

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error running script:", err);
  process.exit(1);
});
