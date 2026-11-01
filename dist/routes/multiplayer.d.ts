export const router: import("express-serve-static-core").Router;
/**
 * Initialize multiplayer services
 */
export function initializeMultiplayerServices(io: any): void;
/**
 * Get the initialized room manager (for Socket.IO handlers)
 */
export function getRoomManager(): any;
/**
 * Get the initialized session manager (for Socket.IO handlers)
 */
export function getSessionManager(): any;
/**
 * Get the initialized anti-cheat system (for Socket.IO handlers)
 */
export function getAntiCheatSystem(): any;
/**
 * Get the initialized tournament manager (for Socket.IO handlers)
 */
export function getTournamentManager(): any;
//# sourceMappingURL=multiplayer.d.ts.map