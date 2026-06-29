import type { HibahInternal } from "../hibahinternal.model.js";
import type { HibahInternalResponseDto, HibahInternalTeamInputDto } from "../dto/hibahinternal.dto.js";

export function parseHibahTeam(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
      return parsed.map((item) => item.trim()).filter(Boolean);
    }
  } catch {
    // Fallback to human-entered textarea values from the current admin UI.
  }

  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeHibahTeamInput(value: HibahInternalTeamInputDto): string[] {
  const team = Array.isArray(value)
    ? value.map((item) => item.trim()).filter(Boolean)
    : parseHibahTeam(value);

  return team;
}

export function toHibahInternalResponse(row: HibahInternal): HibahInternalResponseDto {
  return {
    id: row.id,
    tipe_hibah: row.tipe_hibah,
    judul_hibah: row.judul_hibah,
    susunan_tim_hibah: parseHibahTeam(row.susunan_tim_hibah),
    tahun_hibah: row.tahun_hibah,
    dana_hibah: row.dana_hibah,
    pengalaman_riset_description: row.pengalaman_riset_description,
    users: (row.users ?? []).map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      nidn: user.nidn,
    })),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
