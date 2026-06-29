import type { z } from "zod";
import type { createProductRisetSchema, listProductRisetQuerySchema, updateProductRisetSchema } from "../productriset.schema.js";

export type CreateProductRisetDto = z.infer<typeof createProductRisetSchema>;
export type UpdateProductRisetDto = z.infer<typeof updateProductRisetSchema>;
export type ListProductRisetQueryDto = z.infer<typeof listProductRisetQuerySchema>;

export interface ProductRisetResponseDto {
  id: string;
  nama_produk: string;
  produk_riset_description: string | null;
  createdAt: Date;
  updatedAt: Date;
}
