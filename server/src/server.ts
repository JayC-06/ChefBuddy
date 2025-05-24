import express, { Request, Response } from 'express';
import path from 'node:path';
import dotenv from 'dotenv';
import cors from 'cors';
import db from './config/connection.js';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs, resolvers } from './schemas/index.js';
import { authenticateToken } from './utils/auth.js';
import recipeRoutes from './api/recipes.js';
import historyRoutes from './api/history.js';
import fridgeRoutes from './api/myFridge.js';

dotenv.config();

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

  // ✅ Mount REST API route
  app.use('/api/recipes', recipeRoutes);
  app.use('/api/history', historyRoutes);
  app.use('/api/fridge', fridgeRoutes);

  // ✅ GraphQL setup
  app.use(
    '/graphql',
    expressMiddleware(server as any, {
      context: authenticateToken as any,
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
