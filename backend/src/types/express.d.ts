import type { AuthenticatedIdentity } from "../services/token.service.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedIdentity;
    }
  }
}

export {};
