import type { ProductRiset } from "../productriset.model.js";
import type { ProductRisetResponseDto } from "../dto/productriset.dto.js";

export function toProductRisetResponse(row: ProductRiset): ProductRisetResponseDto {
  return {
    id: row.id,
    nama_produk: row.nama_produk,
    produk_riset_description: row.produk_riset_description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
