import type { ProductResponseDto } from "../dto/product.dto.js";
import type { ProductRecord } from "../product.model.js";

export function toProductResponse(product: ProductRecord): ProductResponseDto {
  return { ...product };
}
