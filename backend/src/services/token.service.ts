import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env.js";
import { AuthenticationError } from "../errors/authentication-error.js";
import type { User, UserRole } from "../types/user.js";

const tokenPayloadSchema = z.object({
  sub: z.string().min(1),
  username: z.string().min(1),
  role: z.enum(["ADMIN", "LEARNER"]),
  ver: z.number().int().nonnegative(),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

export interface AuthenticatedIdentity {
  id: string;
  username: string;
  role: UserRole;
  authVersion: number;
}

/** Creates short-lived JWTs containing only the identity fields required for authorization. */
export class TokenService {
  public create(user: User): string {
    const options: SignOptions = {
      subject: user.id,
      expiresIn: env.JWT_EXPIRES_IN as NonNullable<SignOptions["expiresIn"]>,
    };

    return jwt.sign(
      { username: user.username, role: user.role, ver: user.authVersion },
      env.JWT_SECRET,
      options,
    );
  }

  public verify(token: string): AuthenticatedIdentity {
    try {
      const decodedToken = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      const payload = tokenPayloadSchema.parse(decodedToken);
      return {
        id: payload.sub,
        username: payload.username,
        role: payload.role,
        authVersion: payload.ver,
      };
    } catch {
      throw new AuthenticationError("Your session is invalid or has expired");
    }
  }
}

export const tokenService = new TokenService();
