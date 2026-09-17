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

  // Check if existing connection is active and connected to Basics database
  if (
    cached.conn &&
    mongoose.connection.readyState === 1 &&
    mongoose.connection.name === "Basics"
  ) {
    return cached.conn;
  }

  if (
    !cached.promise ||
    mongoose.connection.readyState === 0 ||
    mongoose.connection.name !== "Basics"
  ) {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect().catch(() => {});
    }
    const opts = {
      dbName: "Basics",
      bufferCommands: false,
      maxPoolSize: 50,
      minPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxIdleTimeMS: 30000,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        return mongooseInstance;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    console.error("MongoDB connection failed ❌", err);
    cached.promise = null; // Reset the promise so subsequent calls retry
    throw err;
  }
};
