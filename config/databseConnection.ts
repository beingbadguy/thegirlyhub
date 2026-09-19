import mongoose from "mongoose";

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export const databaseConnection = async () => {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      "Please define MONGODB_URI in your environment variables (.env / .env.local)."
    );
  }

  // 1. If already connected and ready, return existing connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // 2. If a connection is already in progress, wait for it rather than creating a duplicate
  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      dbName: "Basics",
      bufferCommands: true, // Keep buffered operations enabled so concurrent queries don't throw MongoNotConnectedError
      maxPoolSize: 50,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxIdleTimeMS: 30000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null; // Reset promise so subsequent requests can re-attempt
    cached.conn = null;
    console.error("MongoDB connection failed ❌", err);
    throw err;
  }
};
