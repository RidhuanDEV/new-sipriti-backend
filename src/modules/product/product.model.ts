export type ProductCategory = "elektronik" | "pakaian" | "makanan";

export interface ProductRecord {
  id: string;
  name: string;
  price: number;
  category: ProductCategory;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
