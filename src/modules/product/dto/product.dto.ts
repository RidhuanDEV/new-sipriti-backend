import type { ProductCategory, ProductRecord } from "../product.model.js";

export interface ProductResponseDto extends ProductRecord {}

export interface CreateProductDto {
  name: string;
  price: number;
  category: ProductCategory;
  description?: string | null | undefined;
}

export interface UpdateProductDto {
  name?: string | undefined;
  price?: number | undefined;
  category?: ProductCategory | undefined;
  description?: string | null | undefined;
}

export interface ListProductsQueryDto {
  page: number;
  limit: number;
  search?: string | undefined;
  q?: string | undefined;
  category?: ProductCategory | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
}

export interface ProductPaginationDto {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
