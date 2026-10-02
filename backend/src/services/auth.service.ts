import bcrypt from "bcrypt";
import { AuthenticationError } from "../errors/authentication-error.js";
import {
  userRepository,
  type UserRepository,
} from "../repositories/user.repository.js";
import { toPublicUser, type PublicUser } from "../types/user.js";
import { tokenService, type TokenService } from "./token.service.js";

export interface LoginResult {
  token: string;
  user: PublicUser;
}

/** Coordinates credential validation and token creation without leaking password hashes. */
export class AuthService {
  public constructor(
    private readonly users: UserRepository = userRepository,
    private readonly tokens: TokenService = tokenService,
  ) {}

  public async login(username: string, password: string): Promise<LoginResult> {
    const user = await this.users.findByUsername(username);

    if (
      !user ||
      !user.active ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      throw new AuthenticationError();
    }

    return { token: this.tokens.create(user), user: toPublicUser(user) };
  }

  public async getActiveUser(userId: string): Promise<PublicUser> {
    const user = await this.users.findById(userId);
    if (!user || !user.active)
      throw new AuthenticationError("Your account is no longer active");
    return toPublicUser(user);
  }
}

export const authService = new AuthService();
