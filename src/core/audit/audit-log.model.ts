import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import type {
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";

/**
 * Persistent audit log record. Every CREATE, UPDATE, and DELETE mutation
 * writes one row here — inside the same transaction as the data mutation —
 * so the audit trail is always consistent with the actual database state.
 *
 * Activity-only events (login, view, export) should use auditService.log()
 * which writes to the logger without touching this table.
 */
export class AuditLog extends Model<
  InferAttributes<AuditLog>,
  InferCreationAttributes<AuditLog>
> {
  declare id: CreationOptional<string>;
  /** e.g. 'CREATE' | 'UPDATE' | 'DELETE' */
  declare action: string;
  /** Module / resource name, e.g. 'listing', 'user' */
  declare module: string;
  /** Legacy SIPRITI resource name exposed as entity_type */
  declare entityType: string | null;
  /** Primary key of the affected record */
  declare entityId: string | null;
  declare description: string | null;
  declare oldValue: string | null;
  declare newValue: string | null;
  /** ID of the user who triggered the action */
  declare userId: string | null;
  declare userName: string | null;
  declare ipAddress: string | null;
  declare userAgent: string | null;
  declare httpMethod: string | null;
  declare endpoint: string | null;
  /** JSON-serialised snapshot of the record BEFORE the change (null for CREATE) */
  declare before: string | null;
  /** JSON-serialised snapshot of the payload AFTER the change (null for DELETE) */
  declare after: string | null;
  /** X-Request-Id for cross-referencing with access logs */
  declare requestId: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initModel(sequelize: Sequelize): typeof AuditLog {
  AuditLog.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => generateUuidV7(),
        primaryKey: true,
      },
      action: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      module: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      entityType: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "entity_type",
      },
      entityId: {
        type: DataTypes.STRING(36),
        allowNull: true,
      },
      description: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      oldValue: {
        type: DataTypes.TEXT("long"),
        allowNull: true,
        field: "old_value",
      },
      newValue: {
        type: DataTypes.TEXT("long"),
        allowNull: true,
        field: "new_value",
      },
      userId: {
        type: DataTypes.STRING(36),
        allowNull: true,
      },
      userName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "user_name",
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
        field: "ip_address",
      },
      userAgent: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: "user_agent",
      },
      httpMethod: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: "http_method",
      },
      endpoint: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      before: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      after: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      requestId: {
        type: DataTypes.STRING(36),
        allowNull: true,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: "audit_logs",
      underscored: true,
      indexes: [
        // Query by module + entity (e.g. "show history of listing #42")
        { fields: ["module", "entity_id"] },
        // Query by actor (e.g. "what did user X do?")
        { fields: ["user_id"] },
        { fields: ["entity_type", "entity_id"] },
        // Time-range queries and sorting
        { fields: ["created_at"] },
      ],
    },
  );
  return AuditLog;
}
