import type { NextFunction, Request, Response } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { notificationListQuerySchema } from "./notification.schema.js";
import { notificationService } from "./notification.service.js";

function getRequestId(req: Request): string | undefined {
  const value = req.headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
}

export class NotificationController {
  getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await notificationService.getNotifications(
        requireAuthenticatedUser(req).id,
        notificationListQuerySchema.parse(req.query),
      );
      sendSuccess(res, { message: "Berhasil mendapatkan notifikasi", data: result.rows, meta: result.meta });
    } catch (err) {
      next(err);
    }
  };

  getUnreadCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await notificationService.getUnreadCount(requireAuthenticatedUser(req).id);
      sendSuccess(res, { message: "Berhasil mendapatkan jumlah notifikasi belum dibaca", data: result });
    } catch (err) {
      next(err);
    }
  };

  markAsRead = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const notification = await notificationService.markAsRead(
        req.params.id,
        requireAuthenticatedUser(req).id,
        getRequestId(req),
      );
      sendSuccess(res, { message: "Notifikasi berhasil ditandai sebagai dibaca", data: notification });
    } catch (err) {
      next(err);
    }
  };

  markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await notificationService.markAllAsRead(requireAuthenticatedUser(req).id, getRequestId(req));
      sendSuccess(res, { message: "Semua notifikasi berhasil ditandai sebagai dibaca" });
    } catch (err) {
      next(err);
    }
  };

  acceptInvite = async (req: Request<{ id: string }, unknown, { type?: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await notificationService.acceptInvite(
        req.params.id,
        requireAuthenticatedUser(req),
        req.body.type,
        getRequestId(req),
      );
      if (result.status === "already_accepted") {
        sendSuccess(res, { message: "Undangan sudah diterima sebelumnya", data: result.record ?? null });
        return;
      }
      sendSuccess(res, { message: "Undangan berhasil diterima", data: result.record ?? null });
    } catch (err) {
      next(err);
    }
  };

  rejectInvite = async (req: Request<{ id: string }, unknown, { type?: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await notificationService.rejectInvite(
        req.params.id,
        requireAuthenticatedUser(req),
        req.body.type,
        getRequestId(req),
      );
      if (result.status === "cannot_reject_accepted") {
        sendSuccess(res, { message: "Tidak dapat menolak undangan yang sudah diterima", data: result.record ?? null });
        return;
      }
      if (result.status === "already_rejected") {
        sendSuccess(res, { message: "Undangan sudah ditolak sebelumnya", data: result.record ?? null });
        return;
      }
      sendSuccess(res, { message: "Undangan berhasil ditolak", data: { id: result.id } });
    } catch (err) {
      next(err);
    }
  };
}
