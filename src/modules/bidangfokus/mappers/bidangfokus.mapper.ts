import type { BidangFokus } from "../bidangfokus.model.js";
import type {
  BidangFokusOptionDto,
  BidangFokusResponseDto,
} from "../dto/bidangfokus.dto.js";

export function toBidangFokusResponse(
  bidangFokus: BidangFokus,
): BidangFokusResponseDto {
  return {
    id: bidangFokus.id,
    nama_bidang: bidangFokus.namaBidang,
    createdAt: bidangFokus.createdAt,
    updatedAt: bidangFokus.updatedAt,
  };
}

export function toBidangFokusOption(
  bidangFokus: BidangFokus,
): BidangFokusOptionDto {
  return {
    id: bidangFokus.id,
    nama_bidang: bidangFokus.namaBidang,
  };
}
