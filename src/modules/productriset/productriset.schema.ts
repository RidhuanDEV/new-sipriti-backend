import { z } from "zod";

const optionalText = z.string().trim().optional().nullable();

export const createProductRisetSchema = z.object({
  nama_produk: z.string().trim().min(1, "Nama produk tidak boleh kosong"),
  produk_riset_description: optionalText,
});

export const updateProductRisetSchema = z.object({
  nama_produk: z.string().trim().min(1, "Nama produk tidak boleh kosong").optional(),
  produk_riset_description: optionalText,
});

export const listProductRisetQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(10),
  search: z.string().optional(),
  q: z.string().optional(),
});

export const productRisetIdParamSchema = z.object({
  id: z.string().uuid("Format ID Produk Riset tidak valid"),
});
