import { Op } from "sequelize";
import { HakiProposal } from "../proposal/proposal.model.js";
import { MemberProposal } from "../proposal/member-proposal.model.js";
import { Output } from "../output/output.model.js";
import { Prodi } from "../prodi/prodi.model.js";
import { RABProposal } from "../rab-proposal/rab-proposal.model.js";
import { Skema } from "../skema/skema.model.js";
import { TahunAkademik } from "../tahunakademik/tahunakademik.model.js";
import { User } from "../user/user.model.js";
import type { FindAndCountOptions, Order, WhereOptions } from "sequelize";
import type { ListUsulanQueryDto } from "./usulan.schema.js";

const SORTABLE_FIELD_MAP: Record<string, string> = {
  created_at: "createdAt",
  createdAt: "createdAt",
  updated_at: "updatedAt",
  updatedAt: "updatedAt",
  judul: "judul",
  status: "status_usulan",
  status_usulan: "status_usulan",
  tahun: "tahun_pelaksanaan",
  tahun_pelaksanaan: "tahun_pelaksanaan",
  tipe: "tipe_usulan",
  tipe_usulan: "tipe_usulan",
};

function resolveSortField(sortBy: string): string {
  return SORTABLE_FIELD_MAP[sortBy] ?? "createdAt";
}

function resolveSortOrder(sortOrder: string): "ASC" | "DESC" {
  return sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
}

function buildProposalWhere(query: ListUsulanQueryDto): WhereOptions<HakiProposal> {
  const where: WhereOptions<HakiProposal> = {};

  if (query.search) {
    where.judul = { [Op.like]: `%${query.search}%` };
  }

  if (query.skema) {
    where.skema_id = query.skema;
  }

  if (query.status) {
    where.status_usulan = query.status;
  }

  if (query.tipe) {
    where.tipe_usulan = query.tipe;
  }

  if (query.tahun_akademik_id) {
    where.tahun_akademik_id = query.tahun_akademik_id;
  }

  return where;
}

export class UsulanRepository {
  findAndCountAll(query: ListUsulanQueryDto): Promise<{ rows: HakiProposal[]; count: number }> {
    const order: Order = [[resolveSortField(query.sortBy), resolveSortOrder(query.sortOrder)]];
    const options: FindAndCountOptions<HakiProposal> = {
      where: buildProposalWhere(query),
      subQuery: false,
      include: [
        {
          model: MemberProposal,
          as: "members",
          where: { peran: "Ketua" },
          required: false,
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name", "username", "email"],
            },
          ],
        },
        {
          model: Skema,
          as: "skema",
          attributes: ["id", "namaSkema", "tipe"],
          required: false,
        },
        {
          model: Output,
          as: "outputs",
          attributes: ["id", "namaOutput"],
          through: { attributes: [] },
        },
        {
          model: TahunAkademik,
          as: "tahunAkademik",
          required: false,
        },
      ],
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
      order,
      distinct: true,
    };

    return HakiProposal.findAndCountAll(options);
  }

  findById(id: string): Promise<HakiProposal | null> {
    return HakiProposal.findByPk(id, {
      include: [
        {
          model: MemberProposal,
          as: "members",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name", "username", "email", "institusi", "prodiKode"],
              include: [
                {
                  model: Prodi,
                  as: "prodiRelation",
                  attributes: ["kodeProdi", "namaProdi"],
                  required: false,
                },
              ],
            },
          ],
        },
        {
          model: RABProposal,
          as: "rabs",
        },
        {
          model: Skema,
          as: "skema",
          attributes: ["id", "namaSkema", "tipe"],
          required: false,
        },
        {
          model: Output,
          as: "outputs",
          attributes: ["id", "namaOutput"],
          through: { attributes: [] },
        },
        {
          model: TahunAkademik,
          as: "tahunAkademik",
          required: false,
        },
      ],
    });
  }

  count(where: WhereOptions<HakiProposal>): Promise<number> {
    return HakiProposal.count({ where });
  }
}
