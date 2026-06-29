import { Op } from "sequelize";
import { Pengumuman } from "./pengumuman.model.js";
import type { Transaction, WhereOptions } from "sequelize";
import type { CreatePengumumanDto, ListPengumumanQueryDto, UpdatePengumumanDto } from "./dto/pengumuman.dto.js";

export class PengumumanRepository {
  findAndCount(
    query: ListPengumumanQueryDto,
    pagination: { limit: number; offset: number },
    maxLimit: number,
  ): Promise<{ rows: Pengumuman[]; count: number }> {
    const where: WhereOptions<Pengumuman> = query.q
      ? {
        [Op.or]: [
        { judul: { [Op.like]: `%${query.q}%` } },
        { isi_pengumuman: { [Op.like]: `%${query.q}%` } },
        ],
      }
      : {};

    return Pengumuman.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: Math.min(pagination.limit, maxLimit),
      offset: pagination.offset,
    });
  }

  findById(id: string): Promise<Pengumuman | null> {
    return Pengumuman.findByPk(id);
  }

  findBySlug(slug: string): Promise<Pengumuman | null> {
    return Pengumuman.findOne({ where: { slug } });
  }

  countBySlug(slug: string, excludeId?: string): Promise<number> {
    const where =
      excludeId === undefined ? { slug } : { slug, id: { [Op.ne]: excludeId } };
    return Pengumuman.count({ where });
  }

  create(
    data: CreatePengumumanDto & {
      slug: string;
      gambar: string | null;
      file_lampiran: string | null;
      tanggal_rilis: Date;
    },
    transaction?: Transaction,
  ): Promise<Pengumuman> {
    return Pengumuman.create(
      {
        judul: data.judul,
        slug: data.slug,
        isi_pengumuman: data.isi_pengumuman,
        gambar: data.gambar,
        file_lampiran: data.file_lampiran,
        tanggal_rilis: data.tanggal_rilis,
      },
      transaction ? { transaction } : {},
    );
  }

  async update(
    pengumuman: Pengumuman,
    data: UpdatePengumumanDto & {
      slug: string;
      gambar: string | null;
      file_lampiran: string | null;
    },
    transaction?: Transaction,
  ): Promise<Pengumuman> {
    await pengumuman.update(
      {
        judul: data.judul,
        slug: data.slug,
        isi_pengumuman: data.isi_pengumuman,
        gambar: data.gambar,
        file_lampiran: data.file_lampiran,
        tanggal_rilis: pengumuman.tanggal_rilis,
      },
      transaction ? { transaction } : {},
    );
    return pengumuman;
  }

  async delete(pengumuman: Pengumuman, transaction?: Transaction): Promise<void> {
    await pengumuman.destroy(transaction ? { transaction } : {});
  }

  findByIdWithDeleted(id: string): Promise<Pengumuman | null> {
    return Pengumuman.findOne({ where: { id }, paranoid: false });
  }

  async restore(pengumuman: Pengumuman, transaction?: Transaction): Promise<void> {
    await pengumuman.restore(transaction ? { transaction } : {});
  }
}
