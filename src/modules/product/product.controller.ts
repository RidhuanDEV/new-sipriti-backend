import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import { ProductService } from "./product.service.js";
import {
  createProductSchema,
  listProductsQuerySchema,
  productIdParamSchema,
  updateProductSchema,
} from "./product.schema.js";

const service = new ProductService();

export class ProductController {
  listProducts = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = service.listProducts(listProductsQuerySchema.parse(req.query));
      sendSuccess(res, {
        message: "Berhasil mengambil daftar produk",
        data: result.data,
        meta: result.meta,
      });
    } catch (err) {
      next(err);
    }
  };

  getProduct = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const params = productIdParamSchema.parse(req.params);
      sendSuccess(res, {
        message: "Berhasil mengambil detail produk",
        data: service.getProduct(params.id),
      });
    } catch (err) {
      next(err);
    }
  };

  createProduct = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const body = createProductSchema.parse(req.body);
      sendSuccess(res, {
        statusCode: 201,
        message: "Produk berhasil dibuat",
        data: service.createProduct(body),
      });
    } catch (err) {
      next(err);
    }
  };

  updateProduct = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const params = productIdParamSchema.parse(req.params);
      const body = updateProductSchema.parse(req.body);
      sendSuccess(res, {
        message: "Produk berhasil diupdate",
        data: service.updateProduct(params.id, body),
      });
    } catch (err) {
      next(err);
    }
  };

  deleteProduct = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const params = productIdParamSchema.parse(req.params);
      service.deleteProduct(params.id);
      sendSuccess(res, { message: "Produk berhasil dihapus" });
    } catch (err) {
      next(err);
    }
  };
}
