import { randomUUID } from "node:crypto";
import type { CreateProductDto, UpdateProductDto } from "./dto/product.dto.js";
import type { ProductRecord } from "./product.model.js";

const products = new Map<string, ProductRecord>();

export class ProductRepository {
  findAll(): ProductRecord[] {
    return Array.from(products.values());
  }

  findById(id: string): ProductRecord | null {
    return products.get(id) ?? null;
  }

  create(data: CreateProductDto): ProductRecord {
    const now = new Date();
    const product: ProductRecord = {
      id: randomUUID(),
      name: data.name,
      price: data.price,
      category: data.category,
      description: data.description ?? null,
      createdAt: now,
      updatedAt: now,
    };

    products.set(product.id, product);
    return product;
  }

  update(product: ProductRecord, data: UpdateProductDto): ProductRecord {
    if (data.name !== undefined) product.name = data.name;
    if (data.price !== undefined) product.price = data.price;
    if (data.category !== undefined) product.category = data.category;
    if (data.description !== undefined) product.description = data.description;
    product.updatedAt = new Date();
    products.set(product.id, product);
    return product;
  }

  delete(id: string): boolean {
    return products.delete(id);
  }
}
