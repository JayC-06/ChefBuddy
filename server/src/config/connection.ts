
// export default db;
import { fileURLToPath } from "url";
import path from "node:path";
import dotenv from "dotenv";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the custom .env path
const envPath = path.resolve(__dirname, "../../src/.env");
dotenv.config({ path: envPath });

console.log("ENV loaded from:", envPath);
console.log("process.env.MONGODB_URI:", process.env.MONGODB_URI);

const db = async (): Promise<typeof mongoose.connection> => {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      "❌ MONGODB_URI is not defined. Check your .env and path loading."
    );
  }

  try {
    console.log("MONGODB_URI right before connect:", MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Database connected.");
    return mongoose.connection;
  } catch (error) {
    console.error("❌ Database connection error:", error);
    throw new Error("Database connection failed.");
  }
};

export default db;
