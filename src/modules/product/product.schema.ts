import { z } from "zod";

export const productCategorySchema = z.enum(["elektronik", "pakaian", "makanan"], {
  message: "Kategori harus salah satu dari: elektronik, pakaian, makanan",
});

export const createProductSchema = z.object({
  name: z.string().trim().min(3, "Nama produk minimal 3 karakter"),
  price: z.coerce.number().min(0, "Harga harus berupa angka positif"),
  category: productCategorySchema,
  description: z.string().trim().optional().nullable(),
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(3, "Nama produk minimal 3 karakter").optional(),
  price: z.coerce.number().min(0, "Harga harus berupa angka positif").optional(),
  category: productCategorySchema.optional(),
  description: z.string().trim().optional().nullable(),
});

export const productIdParamSchema = z.object({
  id: z.string().min(1, "ID produk wajib diisi"),
});

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(10),
  search: z.string().trim().optional(),
  q: z.string().trim().optional(),
  category: productCategorySchema.optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
});

export type CreateProductSchemaDto = z.infer<typeof createProductSchema>;
export type UpdateProductSchemaDto = z.infer<typeof updateProductSchema>;
export type ListProductsQuerySchemaDto = z.infer<typeof listProductsQuerySchema>;
