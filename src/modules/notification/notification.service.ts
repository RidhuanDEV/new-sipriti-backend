import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";
import { generateUuidV7 } from "../../utils/uuid.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { NOTIFICATION_MODULE } from "../../constants/modules.constants.js";
import { auditService } from "../../core/audit/audit.service.js";
import { HttpError } from "../../core/errors/http-error.js";
import { HakiProposal } from "../proposal/proposal.model.js";
import { MemberProposal } from "../proposal/member-proposal.model.js";
import { User } from "../user/user.model.js";
import { Notification } from "./notification.model.js";
import type { Transaction } from "sequelize";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type { NotificationListQuerySchema } from "./notification.schema.js";
import type {
  NotificationMetadata,
  NotificationRelatedType,
  NotificationStatus,
  NotificationType,
} from "./notification.model.js";

export interface InviteActionResult {
  record?: MemberProposal;
  id?: string;
  status: "already_accepted" | "accepted" | "no_proposal" | "cannot_reject_accepted" | "already_rejected" | "rejected";
}

export interface CreateNotificationParams {
  userId: string | null;
  type: NotificationType;
  relatedType?: NotificationRelatedType | null;
  relatedId?: string | null;
  title: string;
  message: string;
  metadata?: NotificationMetadata;
  status?: NotificationStatus;
}

export class NotificationService {
  async createNotification(
    params: CreateNotificationParams,
    transaction?: Transaction,
  ): Promise<Notification> {
    return Notification.create(
      {
        id: generateUuidV7(),
        user_id: params.userId,
        type: params.type,
        related_type: params.relatedType ?? null,
        related_id: params.relatedId ?? null,
        title: params.title,
        message: params.message,
        status: params.status ?? "unread",
        metadata: params.metadata ?? null,
      },
      transaction ? { transaction } : undefined,
    );
  }

  async getNotifications(
    userId: string,
    query: NotificationListQuerySchema,
  ): Promise<{ rows: Notification[]; meta: { currentPage: number; totalPages: number; totalItems: number; itemsPerPage: number } }> {
    const where = {
      user_id: userId,
      ...(query.status ? { status: query.status } : {}),
    };
    const offset = (query.page - 1) * query.limit;
    const { count, rows } = await Notification.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: query.limit,
      offset,
    });
    return {
      rows,
      meta: {
        currentPage: query.page,
        totalPages: Math.ceil(count / query.limit),
        totalItems: count,
        itemsPerPage: query.limit,
      },
    };
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await Notification.count({ where: { user_id: userId, status: "unread" } });
    return { count };
  }

  async markAsRead(id: string, userId: string, requestId?: string): Promise<Notification> {
    const notification = await Notification.findOne({ where: { id, user_id: userId } });
    if (!notification) throw HttpError.notFound("Notifikasi tidak ditemukan");
    const oldStatus = notification.status;
    notification.status = "read";
    await notification.save();
    auditService.persistNonBlocking({
      action: AuditAction.UPDATE,
      module: NOTIFICATION_MODULE,
      entityId: notification.id,
      userId,
      before: { status: oldStatus },
      after: { status: "read" },
      requestId,
    });
    return notification;
  }

  async markAllAsRead(userId: string, requestId?: string): Promise<void> {
    await Notification.update({ status: "read" }, { where: { user_id: userId, status: "unread" } });
    auditService.persistNonBlocking({
      action: AuditAction.UPDATE,
      module: NOTIFICATION_MODULE,
      entityId: userId,
      userId,
      after: { status: "read", scope: "all" },
      requestId,
    });
  }

  async acceptInvite(id: string, user: AuthenticatedUserContext, bodyType?: string, requestId?: string): Promise<InviteActionResult> {
    if (bodyType && bodyType !== "member_proposal") {
      // Legacy ignored invalid type after logging; keep compatibility.
    }
    const record = await MemberProposal.findByPk(id);
    if (!record) throw HttpError.notFound("Data anggota tidak ditemukan");
    if (record.no_identitas !== user.nidn) {
      throw HttpError.forbidden("Anda tidak memiliki akses untuk menerima undangan ini");
    }
    if (record.status_invite === "accepted") {
      await this.clearInviteNotifications(user.id, id);
      auditService.persistNonBlocking({
        action: AuditAction.APPROVE,
        module: NOTIFICATION_MODULE,
        entityId: record.id,
        userId: user.id,
        before: { status_invite: "accepted" },
        after: { status_invite: "accepted" },
        requestId,
      });
      return { record, status: "already_accepted" };
    }

    await sequelize.transaction(async (transaction) => {
      record.status_invite = "accepted";
      await record.save({ transaction });
      const proposal = await HakiProposal.findByPk(record.haki_proposal_id, { transaction });
      if (!proposal) {
        await Notification.destroy({ where: this.inviteNotificationWhere(user.id, id), transaction });
        return;
      }
      await this.createNotification(
        {
          userId: proposal.user_id,
          type: "invite_accepted",
          relatedType: "member_proposal",
          relatedId: record.id,
          title: "Undangan anggota diterima",
          message: `${user.name || "User"} menerima undangan anggota untuk proposal ${proposal.judul}`,
          metadata: {
            proposal_id: proposal.id,
            proposal_title: proposal.judul,
            member_name: user.name,
          },
        },
        transaction,
      );
      await Notification.destroy({ where: this.inviteNotificationWhere(user.id, id), transaction });
    });

    auditService.persistNonBlocking({
      action: AuditAction.APPROVE,
      module: NOTIFICATION_MODULE,
      entityId: record.id,
      userId: user.id,
      before: { status_invite: "pending" },
      after: { status_invite: "accepted" },
      requestId,
    });
    return { record, status: "accepted" };
  }

  async rejectInvite(id: string, user: AuthenticatedUserContext, bodyType?: string, requestId?: string): Promise<InviteActionResult> {
    if (bodyType && bodyType !== "member_proposal") {
      // Legacy ignored invalid type after logging; keep compatibility.
    }
    const record = await MemberProposal.findByPk(id);
    if (!record) throw HttpError.notFound("Data anggota tidak ditemukan");
    if (record.no_identitas !== user.nidn) {
      throw HttpError.forbidden("Anda tidak memiliki akses untuk menolak undangan ini");
    }
    if (record.status_invite === "accepted") {
      await this.clearInviteNotifications(user.id, id);
      return { record, status: "cannot_reject_accepted" };
    }
    if (record.status_invite === "rejected") {
      await this.clearInviteNotifications(user.id, id);
      return { record, status: "already_rejected" };
    }

    await sequelize.transaction(async (transaction) => {
      record.status_invite = "rejected";
      await record.save({ transaction });
      const proposal = await HakiProposal.findByPk(record.haki_proposal_id, { transaction });
      const currentUser = await User.findByPk(user.id, { transaction });
      if (proposal) {
        await this.createNotification(
          {
            userId: proposal.user_id,
            type: "invite_rejected",
            relatedType: "member_proposal",
            relatedId: record.id,
            title: "Undangan anggota ditolak",
            message: `${currentUser?.name || currentUser?.username || "User"} menolak undangan anggota untuk proposal ${proposal.judul}`,
            metadata: {
              proposal_id: proposal.id,
              proposal_title: proposal.judul,
              member_name: currentUser?.name || currentUser?.username || null,
            },
          },
          transaction,
        );
      }
      await Notification.destroy({ where: this.inviteNotificationWhere(user.id, id), transaction });
    });

    auditService.persistNonBlocking({
      action: AuditAction.DECLINE,
      module: NOTIFICATION_MODULE,
      entityId: record.id,
      userId: user.id,
      before: { status_invite: "pending" },
      after: { status_invite: "rejected" },
      requestId,
    });
    return { id, status: "rejected" };
  }

  private inviteNotificationWhere(userId: string, inviteId: string) {
    return {
      user_id: userId,
      type: "invite_anggota",
      related_id: inviteId,
      related_type: "member_proposal",
    };
  }

  private async clearInviteNotifications(userId: string, inviteId: string): Promise<void> {
    await Notification.destroy({
      where: {
        [Op.and]: [this.inviteNotificationWhere(userId, inviteId)],
      },
    });
  }
}

export const notificationService = new NotificationService();
