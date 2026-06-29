import type { z } from "zod";
import type { createHibahInternalSchema, listHibahInternalQuerySchema, updateHibahInternalSchema } from "../hibahinternal.schema.js";

export type HibahInternalTeamInputDto = string | string[];
export type CreateHibahInternalDto = z.infer<typeof createHibahInternalSchema>;
export type UpdateHibahInternalDto = z.infer<typeof updateHibahInternalSchema>;
export type ListHibahInternalQueryDto = z.infer<typeof listHibahInternalQuerySchema>;

export interface HibahInternalUserDto {
  id: string;
  name: string | null;
  email: string | null;
  nidn: string | null;
}

export interface HibahInternalResponseDto {
  id: string;
  tipe_hibah: string;
  judul_hibah: string;
  susunan_tim_hibah: string[];
  tahun_hibah: string;
  dana_hibah: string;
  pengalaman_riset_description: string | null;
  users: HibahInternalUserDto[];
  createdAt: Date;
  updatedAt: Date;
}
