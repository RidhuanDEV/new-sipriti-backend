import { Op } from "sequelize";
import { AuditLog } from "../../core/audit/audit-log.model.js";
import { HttpError } from "../../core/errors/http-error.js";
import { User } from "../user/user.model.js";
import type { WhereOptions } from "sequelize";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type { AuditLogQuery } from "./auditlog.schema.js";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

interface AuditLogUser {
  id: string;
  name: string | null;
  email: string | null;
}

interface AuditLogRow {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  description: string;
  old_value: JsonValue | null;
  new_value: JsonValue | null;
  user_id: string | null;
  user_name: string | null;
  ip_address: string | null;
  user_agent: string | null;
  http_method: string | null;
  endpoint: string | null;
  user: AuditLogUser | null;
  createdAt: Date;
}

interface AuditPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type AuditWhere = WhereOptions<AuditLog> & {
  userId?: string;
  action?: string;
  entityType?: string;
  createdAt?: {
    [Op.gte]?: Date;
    [Op.lte]?: Date;
  };
};

const SENSITIVE_KEYS = new Set(["password", "token", "access_token", "refresh_token", "authorization", "cookie", "secret"]);

function isAdminUser(user: AuthenticatedUserContext): boolean {
  return user.roles.some((role) => role.name.toLowerCase() === "admin");
}

function parseJsonSnapshot(value: string | null): JsonValue | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return redactJson(parsed);
  } catch {
    return value;
  }
}

function redactJson(value: unknown): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map((item) => redactJson(item));
  if (typeof value === "object") {
    const out: { [key: string]: JsonValue } = {};
    for (const [key, entry] of Object.entries(value)) {
      out[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? "[REDACTED]" : redactJson(entry);
    }
    return out;
  }
  return String(value);
}

async function loadUsers(userIds: Array<string | null>): Promise<Map<string, AuditLogUser>> {
  const uniqueIds = Array.from(new Set(userIds.filter((id): id is string => id !== null && id.length > 0)));
  if (uniqueIds.length === 0) return new Map();
  const users = await User.findAll({
    where: { id: { [Op.in]: uniqueIds } },
    attributes: ["id", "name", "email"],
    paranoid: false,
  });
  return new Map(users.map((user) => [user.id, { id: user.id, name: user.name, email: user.email }]));
}

function serializeAuditLog(log: AuditLog, users: Map<string, AuditLogUser>): AuditLogRow {
  const user = log.userId ? users.get(log.userId) ?? null : null;

  return {
    id: log.id,
    action: log.action,
    entity_type: log.entityType || log.module,
    entity_id: log.entityId,
    description: log.description ?? `${log.action} ${log.entityType || log.module}`,
    old_value: parseJsonSnapshot(log.oldValue ?? log.before),
    new_value: parseJsonSnapshot(log.newValue ?? log.after),
    user_id: log.userId,
    user_name: log.userName ?? user?.name ?? null,
    ip_address: log.ipAddress,
    user_agent: log.userAgent,
    http_method: log.httpMethod,
    endpoint: log.endpoint,
    user,
    createdAt: log.createdAt,
  };
}

export class AuditlogService {
  async getAuditLogs(
    user: AuthenticatedUserContext,
    query: AuditLogQuery,
  ): Promise<{ logs: AuditLogRow[]; pagination: AuditPagination }> {
    const where: AuditWhere = {};
    if (!isAdminUser(user)) where.userId = user.id;
    if (query.action) where.action = query.action;
    if (query.entity_type) where.entityType = query.entity_type;
    if (query.start_date || query.end_date) {
      where.createdAt = {};
      if (query.start_date) where.createdAt[Op.gte] = new Date(query.start_date);
      if (query.end_date) where.createdAt[Op.lte] = new Date(query.end_date);
    }

    const offset = (query.page - 1) * query.limit;
    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: query.limit,
      offset,
    });
    const users = await loadUsers(rows.map((log) => log.userId));
    return {
      logs: rows.map((log) => serializeAuditLog(log, users)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total: count,
        totalPages: Math.ceil(count / query.limit),
      },
    };
  }

  async getAuditLogById(id: string, user: AuthenticatedUserContext): Promise<AuditLogRow> {
    const log = await AuditLog.findByPk(id);
    if (!log) throw HttpError.notFound("Audit log tidak ditemukan");
    if (!isAdminUser(user) && log.userId !== user.id) {
      throw HttpError.forbidden("Anda tidak memiliki akses ke log ini");
    }
    const users = await loadUsers([log.userId]);
    return serializeAuditLog(log, users);
  }
}

export const auditlogService = new AuditlogService();
