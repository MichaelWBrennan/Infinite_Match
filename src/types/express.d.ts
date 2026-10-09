/**
 * Express type augmentations.
 *
 * Several routes read `req.user` (populated by the auth middleware) but the
 * property is not part of Express' own `Request` type, so it must be declared
 * here via declaration merging.
 */

export interface AuthenticatedUser {
  id: string;
  playerId?: string;
  email?: string;
  roles?: string[];
}

declare global {
   
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requestId?: string;
    }
  }
}
