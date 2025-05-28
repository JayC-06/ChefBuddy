import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('MONGODB_URI:', process.env.MONGODB_URI);

import express, { Request, Response } from 'express';
import path from 'node:path';
import cors from 'cors';
import db from './config/connection.js';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs, resolvers } from './schemas/index.js';
import { authenticateToken, authMiddleware } from './utils/auth.js';

console.log(process.env);
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({ req })
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
    '/graphql',
    expressMiddleware(server as any, {
      context: async ({ req }) => {
        const authReq = authenticateToken({ req });
        return Promise.resolve({ req: authReq, user: authReq.user });
      },
    })
  );

  // ✅ Serve frontend in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}!`);
    console.log(`GraphQL at http://localhost:${PORT}/graphql`);
  });
};

startApolloServer();
