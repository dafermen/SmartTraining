import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { ConflictError } from "../errors/conflict-error.js";
import { NotFoundError } from "../errors/not-found-error.js";
import {
  userRepository,
  type UserAuditEvent,
  type UserRepository,
} from "../repositories/user.repository.js";
import {
  toPublicUser,
  type PublicUser,
  type User,
  type UserRole,
} from "../types/user.js";

interface CreateUserInput {
  username: string;
  displayName: string;
  role: UserRole;
  password: string;
}

interface UpdateUserInput {
  displayName: string;
  role: UserRole;
  active: boolean;
}

const BCRYPT_COST = 12;

/** Enforces administrative account invariants above the SQLite repository. */
export class UserManagementService {
  public constructor(private readonly users: UserRepository = userRepository) {}

  public async list(): Promise<PublicUser[]> {
    return (await this.users.list()).map(toPublicUser);
  }

  public async create(
    input: CreateUserInput,
    actorId: string,
  ): Promise<PublicUser> {
    if (await this.users.findByUsername(input.username)) {
      throw new ConflictError(
        "The username is already in use",
        "USERNAME_ALREADY_EXISTS",
      );
    }

    const now = new Date().toISOString();
    const user: User = {
      id: randomUUID(),
      username: input.username,
      displayName: input.displayName,
      role: input.role,
      passwordHash: await bcrypt.hash(input.password, BCRYPT_COST),
      active: true,
      authVersion: 0,
      createdAt: now,
      updatedAt: now,
    };

    try {
      return toPublicUser(await this.users.create(user, actorId));
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("UNIQUE constraint failed: users.username")
      ) {
        throw new ConflictError(
          "The username is already in use",
          "USERNAME_ALREADY_EXISTS",
        );
      }
      throw error;
    }
  }

  public async update(
    id: string,
    input: UpdateUserInput,
    actorId: string,
  ): Promise<PublicUser> {
    const current = await this.requireUser(id);
    if (current.id === actorId && !input.active) {
      throw new ConflictError(
        "You cannot deactivate your own account",
        "CANNOT_DEACTIVATE_SELF",
      );
    }
    if (current.id === actorId && input.role !== current.role) {
      throw new ConflictError(
        "You cannot change your own role",
        "CANNOT_CHANGE_OWN_ROLE",
      );
    }

    const removesActiveAdmin =
      current.role === "ADMIN" &&
      current.active &&
      (input.role !== "ADMIN" || !input.active);
    if (removesActiveAdmin && (await this.users.countActiveAdmins()) <= 1) {
      throw new ConflictError(
        "At least one active administrator is required",
        "LAST_ACTIVE_ADMIN",
      );
    }

    const updated = await this.users.updateManaged(id, input, actorId);
    if (!updated) throw new NotFoundError("User not found", "USER_NOT_FOUND");
    return toPublicUser(updated);
  }

  public async resetPassword(
    id: string,
    password: string,
    actorId: string,
  ): Promise<void> {
    await this.requireUser(id);
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
    const updated = await this.users.updatePasswordHash(
      id,
      passwordHash,
      actorId,
    );
    if (!updated) throw new NotFoundError("User not found", "USER_NOT_FOUND");
  }

  public listAudit(limit: number): Promise<UserAuditEvent[]> {
    return this.users.listAudit(limit);
  }

  private async requireUser(id: string): Promise<User> {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundError("User not found", "USER_NOT_FOUND");
    return user;
  }
}

export const userManagementService = new UserManagementService();
