import { z } from "zod";
import type { createPanduanSchema, listPanduanQuerySchema, updatePanduanSchema } from "../panduan.schema.js";

export type CreatePanduanDto = z.infer<typeof createPanduanSchema>;
export type UpdatePanduanDto = z.infer<typeof updatePanduanSchema>;
export type ListPanduanQueryDto = z.infer<typeof listPanduanQuerySchema>;

export interface PanduanResponseDto {
  id: string;
  judul: string;
  isi_panduan: string;
  thumbnail: string | null;
  file_url: string | null;
  createdAt: Date;
  updatedAt: Date;
  deleted_at: null;
}
