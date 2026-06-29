import { sequelize } from "../../config/database.js";
import { auditService } from "../../core/audit/audit.service.js";
import { countRowsByColumn } from "../../core/database/table-introspection.js";
import { buildSimplePaginationMeta, normalizePagination } from "../../core/master-data/pagination.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { TAHUN_AKADEMIK_MODULE } from "../../constants/modules.constants.js";
import { HttpError } from "../../core/errors/http-error.js";
import { TahunAkademikRepository } from "./tahunakademik.repository.js";
import { toTahunAkademikResponse } from "./mappers/tahunakademik.mapper.js";
import type { Semester } from "./tahunakademik.model.js";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type { SimplePaginationMeta } from "../../core/master-data/pagination.js";
import type { CreateTahunAkademikDto, ListTahunAkademikQueryDto, TahunAkademikResponseDto, UpdateTahunAkademikDto } from "./dto/tahunakademik.dto.js";

const repository = new TahunAkademikRepository();

function assertValidAcademicYear(tahunMulai: number, tahunSelesai: number): void {
  if (tahunMulai >= tahunSelesai) throw HttpError.badRequest("Tahun mulai harus lebih kecil dari tahun selesai");
  if (tahunSelesai - tahunMulai !== 1) throw HttpError.badRequest("Selisih tahun akademik harus 1 tahun");
}

export class TahunAkademikService {
  async findAll(query: ListTahunAkademikQueryDto): Promise<{ rows: TahunAkademikResponseDto[]; meta: SimplePaginationMeta }> {
    if (query.tahun_mulai !== undefined && query.tahun_selesai !== undefined && query.tahun_mulai > query.tahun_selesai) {
      throw HttpError.badRequest("Filter tahun tidak valid");
    }
    const pagination = normalizePagination(query, 10, 200);
    const { rows, count } = await repository.findAndCount(query, pagination);
    return { rows: rows.map((row) => toTahunAkademikResponse(row)), meta: buildSimplePaginationMeta(pagination.page, pagination.limit, count) };
  }

  async findAllUnpaginated(): Promise<TahunAkademikResponseDto[]> {
    return (await repository.findAll()).map((row) => toTahunAkademikResponse(row));
  }

  async findById(id: string): Promise<TahunAkademikResponseDto> {
    const tahun = await repository.findById(id);
    if (!tahun) throw HttpError.notFound("Tahun akademik tidak ditemukan");
    return toTahunAkademikResponse(tahun);
  }

  async create(data: CreateTahunAkademikDto, user: AuthenticatedUserContext, requestId?: string): Promise<TahunAkademikResponseDto> {
    const semester: Semester = data.semester ?? "Ganjil";
    assertValidAcademicYear(data.tahun_mulai, data.tahun_selesai);
    const duplicate = await repository.findDuplicate(data.tahun_mulai, data.tahun_selesai, semester);
    if (duplicate) throw HttpError.badRequest(`Tahun akademik ${semester} ${data.tahun_mulai}/${data.tahun_selesai} sudah ada`);
    const created = await sequelize.transaction((trx) => repository.create({ ...data, semester }, trx));
    auditService.persistNonBlocking({ action: AuditAction.CREATE, module: TAHUN_AKADEMIK_MODULE, entityId: created.id, userId: user.id, after: toTahunAkademikResponse(created), requestId });
    return toTahunAkademikResponse(created);
  }

  async update(id: string, data: UpdateTahunAkademikDto, user: AuthenticatedUserContext, requestId?: string): Promise<TahunAkademikResponseDto> {
    const tahun = await repository.findById(id);
    if (!tahun) throw HttpError.notFound("Tahun akademik tidak ditemukan");
    const semester: Semester = data.semester ?? tahun.semester;
    const tahunMulai = data.tahun_mulai ?? tahun.tahunMulai;
    const tahunSelesai = data.tahun_selesai ?? tahun.tahunSelesai;
    assertValidAcademicYear(tahunMulai, tahunSelesai);
    const duplicate = await repository.findDuplicate(tahunMulai, tahunSelesai, semester, id);
    if (duplicate) throw HttpError.badRequest(`Tahun akademik ${semester} ${tahunMulai}/${tahunSelesai} sudah ada`);
    const before = toTahunAkademikResponse(tahun);
    const updated = await sequelize.transaction((trx) => repository.update(tahun, { tahunMulai, tahunSelesai, semester }, trx));
    auditService.persistNonBlocking({ action: AuditAction.UPDATE, module: TAHUN_AKADEMIK_MODULE, entityId: updated.id, userId: user.id, before, after: toTahunAkademikResponse(updated), requestId });
    return toTahunAkademikResponse(updated);
  }

  async delete(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<void> {
    const tahun = await repository.findById(id);
    if (!tahun) throw HttpError.notFound("Tahun akademik tidak ditemukan");
    const relatedPublikasi = await countRowsByColumn("publikasis", "tahun_akademik_id", id);
    if (relatedPublikasi > 0) {
      throw HttpError.badRequest(`Tidak dapat menghapus tahun akademik karena terdapat ${relatedPublikasi} entri publikasi yang terkait`);
    }
    const before = toTahunAkademikResponse(tahun);
    await sequelize.transaction((trx) => repository.delete(tahun, trx));
    auditService.persistNonBlocking({ action: AuditAction.DELETE, module: TAHUN_AKADEMIK_MODULE, entityId: tahun.id, userId: user.id, before, requestId });
  }
}
