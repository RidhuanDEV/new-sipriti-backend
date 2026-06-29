import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { NotificationController } from "./notification.controller.js";
import {
  inviteActionBodySchema,
  inviteIdParamSchema,
  notificationIdParamSchema,
  notificationListQuerySchema,
} from "./notification.schema.js";

const controller = new NotificationController();
const router = Router();

router.get("/", authenticate, validate({ query: notificationListQuerySchema }), controller.getNotifications);
router.get("/unread-count", authenticate, controller.getUnreadCount);
router.put("/read-all", authenticate, controller.markAllAsRead);
router.put("/:id/read", authenticate, validate({ params: notificationIdParamSchema }), controller.markAsRead);
router.put("/:id/accept-invite", authenticate, validate({ params: inviteIdParamSchema, body: inviteActionBodySchema }), controller.acceptInvite);
router.put("/:id/reject-invite", authenticate, validate({ params: inviteIdParamSchema, body: inviteActionBodySchema }), controller.rejectInvite);

export const path = "/notifications";
export default router;
