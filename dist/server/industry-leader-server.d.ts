/**
 * Industry Leader Server - The Ultimate Game Development Server
 * Integrates all AI systems to create the most advanced mobile game ever built
 */
export class IndustryLeaderServer {
    logger: Logger;
    app: import("express-serve-static-core").Express;
    server: HttpServer<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>;
    io: SocketIOServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
    port: string | number;
    isInitialized: boolean;
    industryLeaderEngine: IndustryLeaderEngine;
    /**
     * Setup middleware
     */
    setupMiddleware(): void;
    /**
     * Setup routes
     */
    setupRoutes(): void;
    /**
     * Setup Socket.IO handlers
     */
    setupSocketHandlers(): void;
    /**
     * Setup error handling
     */
    setupErrorHandling(): void;
    /**
     * Start the server
     */
    start(): Promise<void>;
    /**
     * Stop the server
     */
    stop(): Promise<void>;
}
import { Logger } from '../core/logger/index.js';
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { IndustryLeaderEngine } from '../services/industry-leader-engine.js';
//# sourceMappingURL=industry-leader-server.d.ts.map