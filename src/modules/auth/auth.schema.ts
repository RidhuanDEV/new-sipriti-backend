import { z } from "zod";

const optionalTrimmedString = z.union([z.string().trim(), z.null()]).optional();

const optionalEmail = z
  .union([
    z.string().trim().email("Invalid email address").toLowerCase(),
    z.literal(""),
    z.null(),
  ])
  .optional();

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(4, "Username minimal 4 karakter")
    .max(16, "Username maksimal 16 karakter")
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh berisi huruf, angka, dan underscore")
    .toLowerCase(),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(72, "Password maksimal 72 karakter"),
  confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  name: z.string().trim().min(1, "Nama wajib diisi").max(100, "Nama maksimal 100 karakter"),
  role_id: z.array(z.string()).min(1, "Role wajib dipilih"),
  email: optionalEmail,
  nidn: optionalTrimmedString,
  prodi_kode: optionalTrimmedString,
  institusi: optionalTrimmedString,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password dan konfirmasi password harus sama",
  path: ["confirmPassword"],
});

export const loginSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(1, "Username wajib diisi")
      .toLowerCase()
      .optional(),
    email: z
      .string()
      .trim()
      .email("Invalid email address")
      .toLowerCase()
      .optional(),
    password: z.string().trim().min(1, "Password is required"),
  })
  .refine((data) => Boolean(data.username || data.email), {
    message: "Username wajib diisi",
    path: ["username"],
  });

export const searchUsersQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  query: z.string().trim().max(100).optional(),
  exclude_proposal_id: z.string().trim().optional(),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().max(100).optional().default(""),
  role: z.string().trim().max(64).optional().default(""),
  prodi: z.string().trim().max(64).optional().default(""),
  status: z.enum(["all", "active", "inactive"]).optional(),
  is_active: z.string().trim().optional(),
});

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Password lama wajib diisi").optional(),
    old_password: z.string().min(1, "Password lama wajib diisi").optional(),
    currentPassword: z.string().min(1, "Password lama wajib diisi").optional(),
    newPassword: z
      .string()
      .min(8, "Password baru minimal 8 karakter")
      .max(72, "Password baru maksimal 72 karakter"),
    confirmNewPassword: z.string().min(1, "Konfirmasi password baru wajib diisi").optional(),
    confirmPassword: z.string().min(1, "Konfirmasi password baru wajib diisi").optional(),
  })
  .refine((data) => Boolean(data.oldPassword || data.old_password || data.currentPassword), {
    message: "Password lama wajib diisi",
    path: ["currentPassword"],
  })
  .refine((data) => data.newPassword === (data.confirmNewPassword ?? data.confirmPassword), {
    message: "Password baru dan konfirmasi harus sama",
    path: ["confirmNewPassword"],
  });

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(100, "Nama maksimal 100 karakter").optional(),
  email: optionalEmail,
  nidn: optionalTrimmedString,
  prodi_kode: optionalTrimmedString,
  institusi: optionalTrimmedString,
  nomor_telepon: optionalTrimmedString,
});

export const adminUpdateUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(4, "Username minimal 4 karakter")
    .max(16, "Username maksimal 16 karakter")
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh berisi huruf, angka, dan underscore")
    .toLowerCase()
    .optional(),
  name: z.string().trim().min(1, "Nama wajib diisi").max(100, "Nama maksimal 100 karakter").optional(),
  email: optionalEmail,
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(72, "Password maksimal 72 karakter")
    .optional()
    .nullable(),
  role_id: z.array(z.string().uuid()).optional(),
  prodi_kode: optionalTrimmedString,
  nidn: optionalTrimmedString,
  institusi: optionalTrimmedString,
  is_active: z.coerce.boolean().optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().min(1, "ID user wajib diisi"),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type SearchUsersQueryDto = z.infer<typeof searchUsersQuerySchema>;
export type ListUsersQueryDto = z.infer<typeof listUsersQuerySchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
export type AdminUpdateUserDto = z.infer<typeof adminUpdateUserSchema>;
export type UserIdParamDto = z.infer<typeof userIdParamSchema>;
