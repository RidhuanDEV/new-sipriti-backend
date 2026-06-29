import { AuditLog } from "./audit-log.model.js";
import type { Transaction } from "sequelize";

export interface CreateAuditLogData {
  action: string;
  module: string;
  entityType?: string;
  entityId: string;
  userId: string;
  userName?: string | null;
  description?: string;
  /** Data snapshot before the change. Will be JSON-serialised. */
  before?: unknown;
  /** Data snapshot after the change. Will be JSON-serialised. */
  after?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  httpMethod?: string | null;
  endpoint?: string | null;
  requestId?: string | null;
}

export class AuditLogRepository {
  async create(data: CreateAuditLogData, trx?: Transaction): Promise<void> {
    const beforeSnapshot = data.before !== undefined ? JSON.stringify(data.before) : null;
    const afterSnapshot = data.after !== undefined ? JSON.stringify(data.after) : null;

    await AuditLog.create(
      {
        action: data.action,
        module: data.module,
        entityType: data.entityType ?? data.module,
        entityId: data.entityId,
        userId: data.userId,
        userName: data.userName ?? null,
        description: data.description ?? `${data.action} ${data.module}`,
        before: beforeSnapshot,
        after: afterSnapshot,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
        httpMethod: data.httpMethod ?? null,
        endpoint: data.endpoint ?? null,
        requestId: data.requestId ?? null,
      },
      trx ? { transaction: trx } : undefined,
    );
  }
}

export const auditLogRepository = new AuditLogRepository();
