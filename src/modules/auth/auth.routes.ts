import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requirePermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import {
  adminUpdateUserSchema,
  changePasswordSchema,
  listUsersQuerySchema,
  loginSchema,
  registerSchema,
  searchUsersQuerySchema,
  updateProfileSchema,
  userIdParamSchema,
} from "./auth.schema.js";

const router = Router();
const controller = new AuthController();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: password123
 *     responses:
 *       201:
 *         description: User registered successfully
 *       409:
 *         description: Email already registered
 */
router.post(
  "/register",
  validate({ body: registerSchema }),
  controller.register,
);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with legacy username credentials
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Login'
 *     responses:
 *       200:
 *         description: Login successful, sets jwt cookie and returns user data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *       400:
 *         description: Invalid credentials
 */
router.post(
  "/login",
  validate({ body: loginSchema }),
  controller.login,
);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the currently authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user info (password excluded)
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authenticate, controller.me);
router.post("/logout", authenticate, controller.logout);
router.put(
  "/change-password",
  authenticate,
  validate({ body: changePasswordSchema }),
  controller.changePassword,
);
router.put(
  "/profile",
  authenticate,
  validate({ body: updateProfileSchema }),
  controller.updateProfile,
);
router.get(
  "/search",
  authenticate,
  requirePermission("view_users"),
  validate({ query: searchUsersQuerySchema }),
  controller.searchUsers,
);
router.get(
  "/list",
  authenticate,
  requirePermission("view_users"),
  validate({ query: listUsersQuerySchema }),
  controller.listUsers,
);
router.get(
  "/admin/list",
  authenticate,
  requirePermission("view_users"),
  validate({ query: listUsersQuerySchema }),
  controller.listUsersAdmin,
);
router.get(
  "/admin/:id",
  authenticate,
  requirePermission("view_users"),
  validate({ params: userIdParamSchema }),
  controller.getUserById,
);
router.put(
  "/admin/:id",
  authenticate,
  requirePermission("edit_user"),
  validate({ params: userIdParamSchema, body: adminUpdateUserSchema }),
  controller.adminUpdateUser,
);
router.delete(
  "/admin/:id/deactivate",
  authenticate,
  requirePermission("delete_user"),
  validate({ params: userIdParamSchema }),
  controller.deactivateUser,
);
router.put(
  "/admin/:id/restore",
  authenticate,
  requirePermission("edit_user"),
  validate({ params: userIdParamSchema }),
  controller.restoreUserById,
);

export const path = "/auth";
export default router;
