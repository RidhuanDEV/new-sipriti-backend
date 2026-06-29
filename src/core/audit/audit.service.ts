import type { Transaction } from "sequelize";
import { logger } from "../logger/logger.js";
import { auditLogRepository } from "./audit-log.repository.js";
import type { AuditActionType } from "../../constants/audit.constants.js";
import type { ModuleName } from "../../constants/modules.constants.js";

export interface PersistAuditOptions {
  action: AuditActionType;
  module: ModuleName;
  entityType?: string;
  entityId: string;
  userId: string;
  userName?: string | null;
  description?: string;
  before?: unknown;
  after?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  httpMethod?: string | null;
  endpoint?: string | null;
  requestId?: string | undefined;
  trx?: Transaction;
  throwOnError?: boolean;
}

export class AuditService {
  log(
    action: AuditActionType,
    module: ModuleName,
    userId: string,
    data?: unknown,
  ): void {
    logger.info(
      {
        audit: {
          action,
          module,
          userId,
          data,
          timestamp: new Date().toISOString(),
        },
      },
      `AUDIT: ${action} on ${module} by ${userId}`,
    );
  }

  async persist(options: PersistAuditOptions): Promise<void> {
    const {
      action,
      module,
      entityType,
      entityId,
      userId,
      userName,
      description,
      before,
      after,
      ipAddress,
      userAgent,
      httpMethod,
      endpoint,
      requestId,
      trx,
    } = options;
    // When called inside a transaction, re-throw by default so the transaction
    // rolls back if the audit INSERT fails (no silent partial commit).
    const throwOnError = options.throwOnError ?? trx !== undefined;

    try {
      await auditLogRepository.create(
        {
          action,
          module,
          entityId,
          userId,
          before,
          after,
          requestId: requestId ?? null,
          ...(entityType === undefined ? {} : { entityType }),
          ...(userName === undefined ? {} : { userName }),
          ...(description === undefined ? {} : { description }),
          ...(ipAddress === undefined ? {} : { ipAddress }),
          ...(userAgent === undefined ? {} : { userAgent }),
          ...(httpMethod === undefined ? {} : { httpMethod }),
          ...(endpoint === undefined ? {} : { endpoint }),
        },
        trx,
      );

      this.log(action, module, userId, { entityId, before, after });
    } catch (err) {
      logger.warn(
        {
          err,
          audit: {
            action,
            module,
            entityId,
            userId,
            requestId: requestId ?? null,
          },
        },
        "Audit persist failed",
      );

      if (throwOnError) {
        throw err;
      }
    }
  }

  persistNonBlocking(options: Omit<PersistAuditOptions, "throwOnError">): void {
    void this.persist({ ...options, throwOnError: false });
  }
}

export const auditService = new AuditService();
