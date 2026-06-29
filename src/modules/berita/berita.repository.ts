import { Op } from "sequelize";
import { Berita } from "./berita.model.js";
import type { Transaction, WhereOptions } from "sequelize";
import type { CreateBeritaDto, ListBeritaQueryDto, UpdateBeritaDto } from "./dto/berita.dto.js";

export class BeritaRepository {
  findAndCount(
    query: ListBeritaQueryDto,
    pagination: { limit: number; offset: number },
    maxLimit: number,
  ): Promise<{ rows: Berita[]; count: number }> {
    const where: WhereOptions<Berita> = {};

    if (query.kategori && query.kategori !== "Semua") {
      where.kategori = query.kategori;
    }

    if (query.q) {
      where.judul = { [Op.like]: `%${query.q}%` };
    }

    return Berita.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: Math.min(pagination.limit, maxLimit),
      offset: pagination.offset,
    });
  }

  findById(id: string): Promise<Berita | null> {
    return Berita.findByPk(id);
  }

  countBySlug(slug: string, excludeId?: string): Promise<number> {
    const where =
      excludeId === undefined ? { slug } : { slug, id: { [Op.ne]: excludeId } };
    return Berita.count({ where });
  }

  create(
    data: CreateBeritaDto & {
      slug: string;
      photo_url: string | null;
      file_url: string | null;
      tanggal_rilis: Date;
    },
    transaction?: Transaction,
  ): Promise<Berita> {
    return Berita.create(
      {
        judul: data.judul,
        slug: data.slug,
        isi_berita: data.isi_berita,
        kategori: data.kategori ?? "Umum",
        photo_url: data.photo_url,
        file_url: data.file_url,
        tanggal_rilis: data.tanggal_rilis,
      },
      transaction ? { transaction } : {},
    );
  }

  async update(
    berita: Berita,
    data: UpdateBeritaDto & {
      slug: string;
      photo_url: string | null;
      file_url: string | null;
    },
    transaction?: Transaction,
  ): Promise<Berita> {
    await berita.update(
      {
        judul: data.judul,
        slug: data.slug,
        isi_berita: data.isi_berita,
        kategori: data.kategori ?? berita.kategori,
        photo_url: data.photo_url,
        file_url: data.file_url,
        tanggal_rilis: berita.tanggal_rilis,
      },
      transaction ? { transaction } : {},
    );
    return berita;
  }

  async delete(berita: Berita, transaction?: Transaction): Promise<void> {
    await berita.destroy(transaction ? { transaction } : {});
  }

  findByIdWithDeleted(id: string): Promise<Berita | null> {
    return Berita.findOne({ where: { id }, paranoid: false });
  }

  async restore(berita: Berita, transaction?: Transaction): Promise<void> {
    await berita.restore(transaction ? { transaction } : {});
  }
}
