import { Op } from "sequelize";
import { TahunAkademik } from "./tahunakademik.model.js";
import type { Semester } from "./tahunakademik.model.js";
import type { Transaction } from "sequelize";
import type {
  CreateTahunAkademikDto,
  ListTahunAkademikQueryDto,
} from "./dto/tahunakademik.dto.js";

export class TahunAkademikRepository {
  findAndCount(
    query: ListTahunAkademikQueryDto,
    pagination: { limit: number; offset: number },
  ): Promise<{ rows: TahunAkademik[]; count: number }> {
    const where: { tahunMulai?: { [Op.between]?: [number, number]; [Op.gte]?: number; [Op.lte]?: number } } = {};
    if (query.tahun_mulai !== undefined && query.tahun_selesai !== undefined) {
      where.tahunMulai = { [Op.between]: [query.tahun_mulai, query.tahun_selesai] };
    } else if (query.tahun_mulai !== undefined) {
      where.tahunMulai = { [Op.gte]: query.tahun_mulai };
    } else if (query.tahun_selesai !== undefined) {
      where.tahunMulai = { [Op.lte]: query.tahun_selesai };
    }

    return TahunAkademik.findAndCountAll({
      where,
      limit: pagination.limit,
      offset: pagination.offset,
      order: [["tahunMulai", "DESC"]],
    });
  }

  findAll(): Promise<TahunAkademik[]> {
    return TahunAkademik.findAll({ order: [["tahunMulai", "DESC"]] });
  }

  findById(id: string): Promise<TahunAkademik | null> {
    return TahunAkademik.findByPk(id);
  }

  findDuplicate(
    tahunMulai: number,
    tahunSelesai: number,
    semester: Semester,
    excludeId?: string,
  ): Promise<TahunAkademik | null> {
    const where =
      excludeId === undefined
        ? { tahunMulai, tahunSelesai, semester }
        : { tahunMulai, tahunSelesai, semester, id: { [Op.ne]: excludeId } };
    return TahunAkademik.findOne({ where });
  }

  create(
    data: CreateTahunAkademikDto & { semester: Semester },
    transaction?: Transaction,
  ): Promise<TahunAkademik> {
    return TahunAkademik.create(
      {
        tahunMulai: data.tahun_mulai,
        tahunSelesai: data.tahun_selesai,
        semester: data.semester,
      },
      transaction ? { transaction } : {},
    );
  }

  async update(
    tahunAkademik: TahunAkademik,
    data: { tahunMulai: number; tahunSelesai: number; semester: Semester },
    transaction?: Transaction,
  ): Promise<TahunAkademik> {
    await tahunAkademik.update(data, transaction ? { transaction } : {});
    return tahunAkademik;
  }

  async delete(tahunAkademik: TahunAkademik, transaction?: Transaction): Promise<void> {
    await tahunAkademik.destroy(transaction ? { transaction } : {});
  }
}
