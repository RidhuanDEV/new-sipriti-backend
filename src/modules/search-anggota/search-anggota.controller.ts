import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import { searchAnggotaQuerySchema } from "./search-anggota.schema.js";
import { searchAnggotaService } from "./search-anggota.service.js";

export class SearchAnggotaController {
  searchAnggota = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = searchAnggotaQuerySchema.parse(req.query);
      const results = await searchAnggotaService.searchAnggota(query.keyword);
      sendSuccess(res, { message: "Berhasil mencari anggota", data: results });
    } catch (err) {
      next(err);
    }
  };
}
