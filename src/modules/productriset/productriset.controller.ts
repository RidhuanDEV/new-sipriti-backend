import type { NextFunction, Request, Response } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { ProductRisetService } from "./productriset.service.js";
import { listProductRisetQuerySchema } from "./productriset.schema.js";
import type { CreateProductRisetDto, UpdateProductRisetDto } from "./dto/productriset.dto.js";

const service = new ProductRisetService();

function getRequestId(req: Request): string | undefined {
  const value = req.headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
}

export class ProductRisetController {
  listProductRiset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.listProductRiset(listProductRisetQuerySchema.parse(req.query));
      sendSuccess(res, { message: "Berhasil mengambil daftar product riset", data: result.rows, meta: result.meta });
    } catch (err) {
      next(err);
    }
  };

  getAllProductRiset = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await service.getAllProductRiset();
      sendSuccess(res, { message: "Berhasil mengambil semua product riset", data });
    } catch (err) {
      next(err);
    }
  };

  getProductRisetById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await service.getProductRisetById(req.params.id);
      sendSuccess(res, { message: "Berhasil mengambil detail product riset", data });
    } catch (err) {
      next(err);
    }
  };

  createProductRiset = async (
    req: Request<Record<string, string>, unknown, CreateProductRisetDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await service.createProductRiset(req.body, requireAuthenticatedUser(req), getRequestId(req));
      sendSuccess(res, { statusCode: 201, message: "Product riset berhasil dibuat", data });
    } catch (err) {
      next(err);
    }
  };

  updateProductRiset = async (
    req: Request<{ id: string }, unknown, UpdateProductRisetDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await service.updateProductRiset(req.params.id, req.body, requireAuthenticatedUser(req), getRequestId(req));
      sendSuccess(res, { message: "Product riset berhasil diperbarui", data });
    } catch (err) {
      next(err);
    }
  };

  deleteProductRiset = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      await service.deleteProductRiset(req.params.id, requireAuthenticatedUser(req), getRequestId(req));
      sendSuccess(res, { message: "Product riset berhasil dihapus", data: null });
    } catch (err) {
      next(err);
    }
  };
}
