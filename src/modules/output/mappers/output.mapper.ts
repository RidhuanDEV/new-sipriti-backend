import type { Output } from "../output.model.js";
import type { OutputOptionDto, OutputResponseDto } from "../dto/output.dto.js";

export function toOutputResponse(output: Output): OutputResponseDto {
  return {
    id: output.id,
    nama_output: output.namaOutput,
    createdAt: output.createdAt,
    updatedAt: output.updatedAt,
  };
}

export function toOutputOption(output: Output): OutputOptionDto {
  return {
    id: output.id,
    nama_output: output.namaOutput,
  };
}
