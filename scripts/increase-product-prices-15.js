const mongoose = require('mongoose');
const uri = 'mongodb+srv://officialgirlyhub_db_user:ltx6mJejxyuR4ZhM@girlyhub.fmm0r5d.mongodb.net/girly';

async function updatePrices() {
  await mongoose.connect(uri, { dbName: 'Basics' });
  const products = await mongoose.connection.collection('products').find().toArray();
  console.log(`Starting 15% price increase for ${products.length} products...`);

  let updatedCount = 0;
  for (const p of products) {
    const oldPrice = Number(p.price) || 0;
    const oldSellingPrice = Number(p.sellingPrice || p.discountedPrice || p.discountPrice || p.price) || 0;

    const newPrice = Math.round(oldPrice * 1.15);
    const newSellingPrice = Math.round(oldSellingPrice * 1.15);
    const newDiscountPercentage = newPrice > newSellingPrice
      ? Math.round(((newPrice - newSellingPrice) / newPrice) * 100)
      : 0;

    const updateDoc = {
      price: newPrice,
      sellingPrice: newSellingPrice,
      discountedPrice: newSellingPrice,
      discountPrice: newSellingPrice,
      discountPercentage: newDiscountPercentage,
      updatedAt: new Date()
    };

    if (Array.isArray(p.variants) && p.variants.length > 0) {
      updateDoc.variants = p.variants.map(v => ({
        ...v,
        price: v.price ? Math.round(v.price * 1.15) : 0,
        discountedPrice: v.discountedPrice ? Math.round(v.discountedPrice * 1.15) : (v.price ? Math.round(v.price * 1.15) : 0)
      }));
    }

    await mongoose.connection.collection('products').updateOne(
      { _id: p._id },
      { $set: updateDoc }
    );
    updatedCount++;
  }

  console.log(`Successfully updated ${updatedCount} products with 15% increase.`);

  // Verify
  const sample = await mongoose.connection.collection('products').find().limit(3).toArray();
  console.log('Sample updated products:');
  for (const s of sample) {
    console.log({
      name: (s.name || s.title || '').slice(0, 40),
      price: s.price,
      sellingPrice: s.sellingPrice,
      discountedPrice: s.discountedPrice,
      discountPercentage: s.discountPercentage
    });
  }

  process.exit(0);
}

updatePrices().catch(err => {
  console.error('Error updating prices:', err);
  process.exit(1);
});
