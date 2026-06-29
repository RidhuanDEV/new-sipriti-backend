import { HttpError } from "../../core/errors/http-error.js";
import { UsulanRepository } from "./usulan.repository.js";
import { toAdminUsulanDetail, toAdminUsulanListItem } from "./mappers/usulan.mapper.js";
import type { WhereOptions } from "sequelize";
import type { HakiProposal } from "../proposal/proposal.model.js";
import type {
  AdminUsulanDetailDto,
  AdminUsulanListItemDto,
  AdminUsulanPaginationDto,
  AdminUsulanStatisticsDto,
} from "./dto/usulan.dto.js";
import type { ListUsulanQueryDto, UsulanStatisticsQueryDto } from "./usulan.schema.js";

const repository = new UsulanRepository();

export class UsulanService {
  async getAllUsulan(query: ListUsulanQueryDto): Promise<{
    data: AdminUsulanListItemDto[];
    pagination: AdminUsulanPaginationDto;
  }> {
    const offset = (query.page - 1) * query.limit;
    const { count, rows } = await repository.findAndCountAll(query);
    const totalPages = Math.ceil(count / query.limit);

    return {
      data: rows.map((proposal, index) => toAdminUsulanListItem(proposal, index, offset)),
      pagination: {
        currentPage: query.page,
        totalPages,
        totalItems: count,
        itemsPerPage: query.limit,
        hasNextPage: query.page < totalPages,
        hasPrevPage: query.page > 1,
      },
    };
  }

  async getUsulanById(id: string): Promise<AdminUsulanDetailDto> {
    const proposal = await repository.findById(id);
    if (!proposal) {
      throw HttpError.notFound("Usulan tidak ditemukan");
    }

    return toAdminUsulanDetail(proposal);
  }

  async getUsulanStatistics(query: UsulanStatisticsQueryDto): Promise<AdminUsulanStatisticsDto> {
    const where: WhereOptions<HakiProposal> = query.tahun ? { tahun_pelaksanaan: query.tahun } : {};
    const [total, draft, pending, approved, declined, penelitian, pengabdian] = await Promise.all([
      repository.count(where),
      repository.count({ ...where, status_usulan: "Draft" }),
      repository.count({ ...where, status_usulan: "Pending" }),
      repository.count({ ...where, status_usulan: "Approved" }),
      repository.count({ ...where, status_usulan: "Declined" }),
      repository.count({ ...where, tipe_usulan: "Penelitian" }),
      repository.count({ ...where, tipe_usulan: "Pengabdian" }),
    ]);

    const byStatus: Record<string, number> = {};
    const byTipe: Record<string, number> = {};

    if (draft > 0) byStatus.Draft = draft;
    if (pending > 0) byStatus.Pending = pending;
    if (approved > 0) byStatus.Approved = approved;
    if (declined > 0) byStatus.Declined = declined;
    if (penelitian > 0) byTipe.Penelitian = penelitian;
    if (pengabdian > 0) byTipe.Pengabdian = pengabdian;

    return { total, byStatus, byTipe };
  }
}
