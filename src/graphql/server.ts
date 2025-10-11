import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';
import { Logger } from '../core/logger/index.js';

const logger = new Logger('GraphQLServer');

export async function createGraphQLServer() {
  const app = express();
  const httpServer = createServer(app);

  // Create WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  // Create GraphQL schema
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  // Set up WebSocket server for subscriptions
  const serverCleanup = useServer({ schema }, wsServer);

  // Create Apollo Server
  const server = new ApolloServer({
    schema,
    plugins: [
      // Proper shutdown for the HTTP server
      ApolloServerPluginDrainHttpServer({ httpServer }),
      // Proper shutdown for the WebSocket server
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
    introspection: process.env.NODE_ENV !== 'production',
    playground: process.env.NODE_ENV !== 'production',
  });

  await server.start();

  // Apply GraphQL middleware
  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        // Add authentication context here
        return {
          user: req.headers.authorization ? { id: 'user-id' } : null,
          requestId: req.headers['x-request-id'] || 'unknown',
        };
      },
    })
  );

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'graphql',
      version: process.env.npm_package_version || '1.0.0',
    });
  });

  const port = process.env.GRAPHQL_PORT || 4000;

  httpServer.listen(port, () => {
    logger.info(`GraphQL server ready at http://localhost:${port}/graphql`);
    logger.info(`WebSocket server ready at ws://localhost:${port}/graphql`);
  });

  return { server, httpServer };
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createGraphQLServer().catch((error) => {
    logger.error('Failed to start GraphQL server', error);
    process.exit(1);
  });
}