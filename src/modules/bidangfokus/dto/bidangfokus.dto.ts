import type { z } from "zod";
import type {
  createBidangFokusSchema,
  listBidangFokusQuerySchema,
  updateBidangFokusSchema,
} from "../bidangfokus.schema.js";

export type CreateBidangFokusDto = z.infer<typeof createBidangFokusSchema>;
export type UpdateBidangFokusDto = z.infer<typeof updateBidangFokusSchema>;
export type ListBidangFokusQueryDto = z.infer<typeof listBidangFokusQuerySchema>;

export interface BidangFokusResponseDto {
  id: string;
  nama_bidang: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BidangFokusOptionDto {
  id: string;
  nama_bidang: string;
}
