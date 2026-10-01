import { databaseConnection } from "../config/databseConnection";
import Product from "../models/product.model";

async function check() {
  await databaseConnection();
  const count = await Product.countDocuments();
  const sample = await Product.find({})
    .select("name title price discountedPrice sellingPrice variants")
    .limit(10)
    .lean();
  console.log("Product count in DB:", count);
  console.log("Sample products:", JSON.stringify(sample, null, 2));
  process.exit(0);
}

check().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
