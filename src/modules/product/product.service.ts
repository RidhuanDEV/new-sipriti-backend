import { HttpError } from "../../core/errors/http-error.js";
import { ProductRepository } from "./product.repository.js";
import { toProductResponse } from "./mappers/product.mapper.js";
import type {
  CreateProductDto,
  ListProductsQueryDto,
  ProductPaginationDto,
  ProductResponseDto,
  UpdateProductDto,
} from "./dto/product.dto.js";

const repository = new ProductRepository();

export class ProductService {
  listProducts(query: ListProductsQueryDto): {
    data: ProductResponseDto[];
    meta: ProductPaginationDto;
  } {
    const searchValue = (query.search ?? query.q ?? "").trim().toLowerCase();
    let filteredProducts = repository.findAll();

    if (query.category) {
      filteredProducts = filteredProducts.filter((product) => product.category === query.category);
    }

    const minPrice = query.minPrice;
    if (minPrice !== undefined) {
      filteredProducts = filteredProducts.filter((product) => product.price >= minPrice);
    }

    const maxPrice = query.maxPrice;
    if (maxPrice !== undefined) {
      filteredProducts = filteredProducts.filter((product) => product.price <= maxPrice);
    }

    if (searchValue.length > 0) {
      filteredProducts = filteredProducts.filter((product) => product.name.toLowerCase().includes(searchValue));
    }

    const total = filteredProducts.length;
    const offset = (query.page - 1) * query.limit;
    const paginatedProducts = filteredProducts.slice(offset, offset + query.limit);

    return {
      data: paginatedProducts.map((product) => toProductResponse(product)),
      meta: {
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      },
    };
  }

  getProduct(id: string): ProductResponseDto {
    const product = repository.findById(id);
    if (!product) {
      throw HttpError.notFound("Produk tidak ditemukan");
    }
    return toProductResponse(product);
  }

  createProduct(data: CreateProductDto): ProductResponseDto {
    return toProductResponse(repository.create(data));
  }

  updateProduct(id: string, data: UpdateProductDto): ProductResponseDto {
    const product = repository.findById(id);
    if (!product) {
      throw HttpError.notFound("Produk tidak ditemukan");
    }
    return toProductResponse(repository.update(product, data));
  }

  deleteProduct(id: string): void {
    if (!repository.delete(id)) {
      throw HttpError.notFound("Produk tidak ditemukan");
    }
  }
}
