import { sequelize } from "../../config/database.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { KATEGORI_PUBLIKASI_MODULE } from "../../constants/modules.constants.js";
import { auditService } from "../../core/audit/audit.service.js";
import { buildSimpleMeta, normalizeSimplePagination } from "../../core/content/legacy-content.js";
import { HttpError } from "../../core/errors/http-error.js";
import { KategoriPublikasiRepository } from "./kategoripublikasi.repository.js";
import { toKategoriPublikasiResponse } from "./mappers/kategoripublikasi.mapper.js";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type { SimplePaginationMeta } from "../../core/master-data/pagination.js";
import type { CreateKategoriPublikasiDto, KategoriPublikasiResponseDto, ListKategoriPublikasiQueryDto, UpdateKategoriPublikasiDto } from "./dto/kategoripublikasi.dto.js";

const repository = new KategoriPublikasiRepository();

export class KategoriPublikasiService {
  async listKategoriPublikasi(
    query: ListKategoriPublikasiQueryDto,
  ): Promise<{ rows: KategoriPublikasiResponseDto[]; meta: SimplePaginationMeta }> {
    const pagination = normalizeSimplePagination(query, 10, 200);
    const result = await repository.findAndCount(query, pagination);
    return {
      rows: result.rows.map((row) => toKategoriPublikasiResponse(row)),
      meta: buildSimpleMeta(pagination.page, pagination.limit, result.count),
    };
  }

  async getKategoriPublikasiById(id: string): Promise<KategoriPublikasiResponseDto> {
    const row = await repository.findById(id);
    if (!row) throw HttpError.notFound("Kategori publikasi tidak ditemukan");
    return toKategoriPublikasiResponse(row);
  }

  async createKategoriPublikasi(
    data: CreateKategoriPublikasiDto,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<KategoriPublikasiResponseDto> {
    const name = data.nama_kategori.trim();
    if (await repository.findByName(name)) throw HttpError.badRequest("Nama kategori sudah terdaftar");
    const created = await sequelize.transaction((trx) => repository.create(name, trx));
    const response = toKategoriPublikasiResponse(created);
    auditService.persistNonBlocking({
      action: AuditAction.CREATE,
      module: KATEGORI_PUBLIKASI_MODULE,
      entityId: created.id,
      userId: user.id,
      after: response,
      requestId,
    });
    return response;
  }

  async updateKategoriPublikasi(
    id: string,
    data: UpdateKategoriPublikasiDto,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<KategoriPublikasiResponseDto> {
    const row = await repository.findById(id);
    if (!row) throw HttpError.notFound("Kategori publikasi tidak ditemukan");

    const name = data.nama_kategori?.trim();
    if (!name) return toKategoriPublikasiResponse(row);
    if (await repository.findByName(name, id)) throw HttpError.badRequest("Nama kategori sudah digunakan");

    const before = toKategoriPublikasiResponse(row);
    const updated = await sequelize.transaction((trx) => repository.update(row, name, trx));
    const response = toKategoriPublikasiResponse(updated);
    auditService.persistNonBlocking({
      action: AuditAction.UPDATE,
      module: KATEGORI_PUBLIKASI_MODULE,
      entityId: updated.id,
      userId: user.id,
      before,
      after: response,
      requestId,
    });
    return response;
  }

  async deleteKategoriPublikasi(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<void> {
    const row = await repository.findById(id);
    if (!row) throw HttpError.notFound("Kategori publikasi tidak ditemukan");

    const before = toKategoriPublikasiResponse(row);
    await sequelize.transaction((trx) => repository.delete(row, trx));
    auditService.persistNonBlocking({
      action: AuditAction.DELETE,
      module: KATEGORI_PUBLIKASI_MODULE,
      entityId: before.id,
      userId: user.id,
      before,
      requestId,
    });
  }
}
