import { chmodSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { env } from "../config/env.js";
import type { User, UserRole } from "../types/user.js";
import { userSchema, usersSchema } from "../validators/user.schemas.js";

interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  role: UserRole;
  display_name: string;
  active: number;
  auth_version: number;
  created_at: string;
  updated_at: string;
}

export interface UserAuditEvent {
  id: number;
  actorId: string;
  targetUserId: string;
  action: string;
  details: string;
  createdAt: string;
}

const mapUser = (row: UserRow): User =>
  userSchema.parse({
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    role: row.role,
    displayName: row.display_name,
    active: row.active === 1,
    authVersion: row.auth_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

/** Stores identities in a private SQLite database using prepared statements. */
export class UserRepository {
  private readonly database: DatabaseSync;

  public constructor(
    databasePath = resolve(env.USER_DATABASE_PATH),
    legacyJsonPath = resolve(env.DATA_STORAGE_PATH, "users.json"),
  ) {
    mkdirSync(dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath, {
      allowExtension: false,
      enableDoubleQuotedStringLiterals: false,
      enableForeignKeyConstraints: true,
    });
    this.database.enableDefensive(true);
    this.database.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA busy_timeout = 5000;
      PRAGMA trusted_schema = OFF;

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL COLLATE NOCASE UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('ADMIN', 'LEARNER')),
        display_name TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
        auth_version INTEGER NOT NULL DEFAULT 0 CHECK (auth_version >= 0),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_users_role_active
        ON users(role, active);

      CREATE TABLE IF NOT EXISTS user_audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        actor_id TEXT NOT NULL,
        target_user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_user_audit_created_at
        ON user_audit_log(created_at DESC);
    `);
    try {
      chmodSync(databasePath, 0o600);
    } catch {
      // Windows does not enforce POSIX modes; production ownership is documented.
    }
    this.importLegacyUsersIfEmpty(legacyJsonPath);
  }

  public async list(): Promise<User[]> {
    return (
      this.database
        .prepare(
          `SELECT id, username, password_hash, role, display_name, active,
                  auth_version, created_at, updated_at
             FROM users
            ORDER BY display_name COLLATE NOCASE, username COLLATE NOCASE`,
        )
        .all() as unknown as UserRow[]
    ).map(mapUser);
  }

  public async findByUsername(username: string): Promise<User | undefined> {
    const row = this.database
      .prepare(
        `SELECT id, username, password_hash, role, display_name, active,
                auth_version, created_at, updated_at
           FROM users WHERE username = ? COLLATE NOCASE`,
      )
      .get(username.trim()) as UserRow | undefined;
    return row ? mapUser(row) : undefined;
  }

  public async findById(id: string): Promise<User | undefined> {
    const row = this.database
      .prepare(
        `SELECT id, username, password_hash, role, display_name, active,
                auth_version, created_at, updated_at
           FROM users WHERE id = ?`,
      )
      .get(id) as UserRow | undefined;
    return row ? mapUser(row) : undefined;
  }

  public async countActiveAdmins(): Promise<number> {
    const row = this.database
      .prepare(
        "SELECT COUNT(*) AS total FROM users WHERE role = 'ADMIN' AND active = 1",
      )
      .get() as { total: number };
    return row.total;
  }

  public async create(user: User, actorId: string): Promise<User> {
    this.transaction(() => {
      this.insertUser(user);
      this.audit(actorId, user.id, "USER_CREATED", { role: user.role });
    });
    return user;
  }

  public async updateManaged(
    id: string,
    input: { displayName: string; role: UserRole; active: boolean },
    actorId: string,
  ): Promise<User | undefined> {
    const now = new Date().toISOString();
    this.transaction(() => {
      this.database
        .prepare(
          `UPDATE users
              SET display_name = ?, role = ?, active = ?,
                  auth_version = auth_version + 1, updated_at = ?
            WHERE id = ?`,
        )
        .run(input.displayName, input.role, input.active ? 1 : 0, now, id);
      this.audit(actorId, id, "USER_UPDATED", {
        role: input.role,
        active: input.active,
      });
    });
    return this.findById(id);
  }

  public async updatePasswordHash(
    id: string,
    passwordHash: string,
    actorId: string,
  ): Promise<User | undefined> {
    const now = new Date().toISOString();
    this.transaction(() => {
      this.database
        .prepare(
          `UPDATE users
              SET password_hash = ?, auth_version = auth_version + 1,
                  updated_at = ?
            WHERE id = ?`,
        )
        .run(passwordHash, now, id);
      this.audit(actorId, id, "PASSWORD_RESET", {});
    });
    return this.findById(id);
  }

  public async upsertSeedUser(user: User): Promise<User> {
    this.database
      .prepare(
        `INSERT INTO users (
           id, username, password_hash, role, display_name, active,
           auth_version, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(username) DO UPDATE SET
           password_hash = excluded.password_hash,
           role = excluded.role,
           display_name = excluded.display_name,
           active = excluded.active,
           auth_version = users.auth_version + 1,
           updated_at = excluded.updated_at`,
      )
      .run(
        user.id,
        user.username,
        user.passwordHash,
        user.role,
        user.displayName,
        user.active ? 1 : 0,
        user.authVersion,
        user.createdAt,
        user.updatedAt,
      );
    return (await this.findByUsername(user.username))!;
  }

  public async listAudit(limit = 50): Promise<UserAuditEvent[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    return this.database
      .prepare(
        `SELECT id, actor_id AS actorId, target_user_id AS targetUserId,
                action, details, created_at AS createdAt
           FROM user_audit_log
          ORDER BY id DESC LIMIT ?`,
      )
      .all(safeLimit) as unknown as UserAuditEvent[];
  }

  public recordAudit(
    actorId: string,
    targetUserId: string,
    action: string,
    details: Record<string, unknown>,
  ): void {
    this.audit(actorId, targetUserId, action, details);
  }

  /** Releases file handles; intended for graceful shutdown and isolated tests. */
  public close(): void {
    this.database.close();
  }

  private insertUser(user: User): void {
    this.database
      .prepare(
        `INSERT INTO users (
           id, username, password_hash, role, display_name, active,
           auth_version, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        user.id,
        user.username,
        user.passwordHash,
        user.role,
        user.displayName,
        user.active ? 1 : 0,
        user.authVersion,
        user.createdAt,
        user.updatedAt,
      );
  }

  private audit(
    actorId: string,
    targetUserId: string,
    action: string,
    details: Record<string, unknown>,
  ): void {
    this.database
      .prepare(
        `INSERT INTO user_audit_log
           (actor_id, target_user_id, action, details, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(
        actorId,
        targetUserId,
        action,
        JSON.stringify(details),
        new Date().toISOString(),
      );
  }

  private transaction(operation: () => void): void {
    this.database.exec("BEGIN IMMEDIATE");
    try {
      operation();
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  private importLegacyUsersIfEmpty(legacyJsonPath: string): void {
    const count = this.database
      .prepare("SELECT COUNT(*) AS total FROM users")
      .get() as {
      total: number;
    };
    if (count.total > 0 || !existsSync(legacyJsonPath)) return;

    const legacyUsers = usersSchema.parse(
      JSON.parse(readFileSync(legacyJsonPath, "utf8")),
    );
    this.transaction(() =>
      legacyUsers.forEach((user) => this.insertUser(user)),
    );
  }
}

export const userRepository = new UserRepository();
