import { z } from "zod";

export const deleteImageParamSchema = z.object({
  filename: z
    .string()
    .trim()
    .min(1, "Nama file tidak boleh kosong")
    .refine((value) => !value.includes("..") && !value.includes("/") && !value.includes("\\"), {
      message: "Nama file tidak valid",
    }),
});
