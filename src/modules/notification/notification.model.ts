import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import type { CreationOptional, InferAttributes, InferCreationAttributes, Sequelize } from "sequelize";

export type NotificationType =
  | "invite_anggota"
  | "invite_accepted"
  | "invite_rejected"
  | "usulan_approved"
  | "usulan_rejected"
  | "forward_usulan";
export type NotificationRelatedType = "member_proposal" | "haki_proposal";
export type NotificationStatus = "unread" | "read";

export type NotificationMetadata =
  | {
      inviter_user_id?: string | null;
      inviter_name?: string | null;
      proposal_id?: string | null;
      proposal_title?: string | null;
      proposal_type?: string | null;
      member_name?: string | null;
      hki_id?: string | null;
      approved_by?: string | null;
      rejected_by?: string | null;
      catatan?: string | null;
      forwarded_by?: string | null;
      proposal_judul?: string | null;
      tipe?: string | null;
    }
  | null;

export class Notification extends Model<
  InferAttributes<Notification>,
  InferCreationAttributes<Notification>
> {
  declare id: CreationOptional<string>;
  declare user_id: CreationOptional<string | null>;
  declare type: NotificationType;
  declare related_type: CreationOptional<NotificationRelatedType | null>;
  declare related_id: CreationOptional<string | null>;
  declare title: string;
  declare message: string;
  declare status: CreationOptional<NotificationStatus>;
  declare metadata: CreationOptional<NotificationMetadata>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initModel(sequelize: Sequelize): typeof Notification {
  Notification.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => generateUuidV7(),
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM(
          "invite_anggota",
          "invite_accepted",
          "invite_rejected",
          "usulan_approved",
          "usulan_rejected",
          "forward_usulan",
        ),
        allowNull: false,
      },
      related_type: {
        type: DataTypes.ENUM("member_proposal", "haki_proposal"),
        allowNull: true,
      },
      related_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("unread", "read"),
        allowNull: false,
        defaultValue: "unread",
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Notification",
      tableName: "notifications",
      freezeTableName: true,
      timestamps: true,
      paranoid: false,
      indexes: [
        { name: "idx_notifications_user_id", fields: ["user_id"] },
        { name: "idx_notifications_status", fields: ["status"] },
        { name: "idx_notifications_user_status", fields: ["user_id", "status"] },
      ],
    },
  );

  return Notification;
}
