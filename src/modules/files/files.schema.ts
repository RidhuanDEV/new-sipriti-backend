import { z } from "zod";

export const fileIdParamSchema = z.object({
  id: z.string().trim().min(1, "ID file wajib diisi"),
});

export const filePathParamSchema = z.object({
  subdir: z
    .string()
    .trim()
    .min(1, "Subdirektori file wajib diisi")
    .refine((value) => !value.includes("..") && !value.includes("\\") && !value.includes("/"), {
      message: "Subdirektori file tidak valid",
    }),
  filename: z
    .string()
    .trim()
    .min(1, "Nama file wajib diisi")
    .refine((value) => !value.includes("..") && !value.includes("\\") && !value.includes("/"), {
      message: "Nama file tidak valid",
    }),
});

export const fileDownloadQuerySchema = z.object({
  download: z.string().optional(),
});
