import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import jwt from "jsonwebtoken";

console.log("MONGODB_URI:", process.env.MONGODB_URI);

import express, { Request, Response } from "express";
import cors from "cors";
import db from "./config/connection.js";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { typeDefs, resolvers } from "./schemas/index.js";
// import { authenticateToken } from "./utils/auth.js";

interface DecodedUserPayload extends jwt.JwtPayload {
  data: {
    _id: string;
    email: string;
    username: string;
  };
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const startApolloServer = async () => {
  await server.start();
  await db();

  const PORT = process.env.PORT || 3001;
  const app = express();

  app.use(cors());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  // ✅ GraphQL setup
  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => {
        const authHeader = req.headers.authorization || ""; // Handle missing auth header
        const token = authHeader.split(" ")[1]; // Assuming Bearer token format
        const secret = process.env.JWT_SECRET_KEY;

        if (!token || !secret) return {};

        try {
          const decoded = jwt.verify(token, secret) as DecodedUserPayload; // Verify the token using the secret key
          return { user: decoded.data }; // Return the decoded user data
        } catch (err) {
          console.warn("Invalid token:", err);
          return {};
        }
      },
    })
  );

  // ✅ Serve frontend in production
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../../client/dist")));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}!`);
    console.log(`GraphQL at http://localhost:${PORT}/graphql`);
  });
};

startApolloServer();
