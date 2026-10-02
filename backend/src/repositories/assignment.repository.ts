import { chmodSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { env } from "../config/env.js";
import type { TrainingAssignment } from "../types/assignment.js";

interface AssignmentRow {
  id: string;
  user_id: string;
  training_id: string;
  assigned_by: string;
  assigned_at: string;
  due_date: string | null;
  updated_at: string;
}

const mapAssignment = (row: AssignmentRow): TrainingAssignment => ({
  id: row.id,
  userId: row.user_id,
  trainingId: row.training_id,
  assignedBy: row.assigned_by,
  assignedAt: row.assigned_at,
  dueDate: row.due_date,
  updatedAt: row.updated_at,
});

/** Persists course assignments alongside identities in the private SQLite file. */
export class AssignmentRepository {
  private readonly database: DatabaseSync;

  public constructor(databasePath = resolve(env.USER_DATABASE_PATH)) {
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

      CREATE TABLE IF NOT EXISTS training_assignments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        training_id TEXT NOT NULL,
        assigned_by TEXT NOT NULL REFERENCES users(id),
        assigned_at TEXT NOT NULL,
        due_date TEXT,
        updated_at TEXT NOT NULL,
        UNIQUE (user_id, training_id)
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_assignments_user
        ON training_assignments(user_id, assigned_at DESC);
      CREATE INDEX IF NOT EXISTS idx_assignments_training
        ON training_assignments(training_id, assigned_at DESC);

      CREATE TABLE IF NOT EXISTS assignment_audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        actor_id TEXT NOT NULL,
        assignment_id TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL
      ) STRICT;
    `);
    try {
      chmodSync(databasePath, 0o600);
    } catch {
      // Windows does not enforce POSIX modes; production ownership is documented.
    }
  }

  public async list(): Promise<TrainingAssignment[]> {
    return (
      this.database
        .prepare(
          `SELECT id, user_id, training_id, assigned_by, assigned_at,
                  due_date, updated_at
             FROM training_assignments
            ORDER BY assigned_at DESC`,
        )
        .all() as unknown as AssignmentRow[]
    ).map(mapAssignment);
  }

  public async listByUser(userId: string): Promise<TrainingAssignment[]> {
    return (
      this.database
        .prepare(
          `SELECT id, user_id, training_id, assigned_by, assigned_at,
                  due_date, updated_at
             FROM training_assignments
            WHERE user_id = ?
            ORDER BY assigned_at DESC`,
        )
        .all(userId) as unknown as AssignmentRow[]
    ).map(mapAssignment);
  }

  public async findById(id: string): Promise<TrainingAssignment | undefined> {
    const row = this.database
      .prepare(
        `SELECT id, user_id, training_id, assigned_by, assigned_at,
                due_date, updated_at
           FROM training_assignments WHERE id = ?`,
      )
      .get(id) as AssignmentRow | undefined;
    return row ? mapAssignment(row) : undefined;
  }

  public async isAssigned(
    userId: string,
    trainingId: string,
  ): Promise<boolean> {
    return Boolean(
      this.database
        .prepare(
          "SELECT 1 FROM training_assignments WHERE user_id = ? AND training_id = ?",
        )
        .get(userId, trainingId),
    );
  }

  public async create(
    assignment: TrainingAssignment,
    actorId: string,
  ): Promise<TrainingAssignment> {
    this.transaction(() => {
      this.database
        .prepare(
          `INSERT INTO training_assignments (
             id, user_id, training_id, assigned_by, assigned_at, due_date, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          assignment.id,
          assignment.userId,
          assignment.trainingId,
          assignment.assignedBy,
          assignment.assignedAt,
          assignment.dueDate,
          assignment.updatedAt,
        );
      this.audit(actorId, assignment.id, "TRAINING_ASSIGNED", {
        userId: assignment.userId,
        trainingId: assignment.trainingId,
        dueDate: assignment.dueDate,
      });
    });
    return assignment;
  }

  public async updateDueDate(
    id: string,
    dueDate: string | null,
    actorId: string,
  ): Promise<TrainingAssignment | undefined> {
    const updatedAt = new Date().toISOString();
    let changes = 0;
    this.transaction(() => {
      const result = this.database
        .prepare(
          "UPDATE training_assignments SET due_date = ?, updated_at = ? WHERE id = ?",
        )
        .run(dueDate, updatedAt, id);
      changes = Number(result.changes);
      if (changes > 0) {
        this.audit(actorId, id, "ASSIGNMENT_DUE_DATE_UPDATED", { dueDate });
      }
    });
    return changes > 0 ? this.findById(id) : undefined;
  }

  public async delete(id: string, actorId: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    this.transaction(() => {
      this.database
        .prepare("DELETE FROM training_assignments WHERE id = ?")
        .run(id);
      this.audit(actorId, id, "TRAINING_UNASSIGNED", {
        userId: existing.userId,
        trainingId: existing.trainingId,
      });
    });
    return true;
  }

  public async deleteByTraining(trainingId: string): Promise<void> {
    this.database
      .prepare("DELETE FROM training_assignments WHERE training_id = ?")
      .run(trainingId);
  }

  public close(): void {
    this.database.close();
  }

  private audit(
    actorId: string,
    assignmentId: string,
    action: string,
    details: Record<string, unknown>,
  ): void {
    this.database
      .prepare(
        `INSERT INTO assignment_audit_log
           (actor_id, assignment_id, action, details, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(
        actorId,
        assignmentId,
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
}

export const assignmentRepository = new AssignmentRepository();
