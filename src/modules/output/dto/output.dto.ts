import type { z } from "zod";
import type {
  createOutputSchema,
  listOutputQuerySchema,
  updateOutputSchema,
} from "../output.schema.js";

export type CreateOutputDto = z.infer<typeof createOutputSchema>;
export type UpdateOutputDto = z.infer<typeof updateOutputSchema>;
export type ListOutputQueryDto = z.infer<typeof listOutputQuerySchema>;

export interface OutputResponseDto {
  id: string;
  nama_output: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OutputOptionDto {
  id: string;
  nama_output: string;
}
