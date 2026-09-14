import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error("Please define MONGODB_URI in environment.");

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export const databaseConnection = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        dbName: "Basics", // optional
        bufferCommands: false,
      })
      .then(async (mongooseInstance) => {
        console.log("🔌 MongoDB Connected");
        try {
          const db = mongooseInstance.connection.db;
          if (db) {
            const productCollection = db.collection("products");
            const indexes = await productCollection.indexes();
            for (const idx of indexes) {
              if (idx.name === "tenantId_1_variants.sku_1") {
                await productCollection.dropIndex(idx.name).catch(() => {});
                console.log(`Dropped problematic index: ${idx.name}`);
              }
            }
          }
        } catch {
          // Ignore index cleanup error
        }
        return mongooseInstance;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    console.error("MongoDB connection failed ❌", err);
    cached.promise = null; // Reset the promise to retry next time
    throw err;
  }
};
