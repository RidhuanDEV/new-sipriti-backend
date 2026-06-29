import { SertifikatMutu } from "./sertifikatmutu.model.js";
import type { Transaction } from "sequelize";
import type {
  CreateSertifikatMutuDto,
  UpdateSertifikatMutuDto,
} from "./dto/sertifikatmutu.dto.js";

export class SertifikatMutuRepository {
  findAndCount(pagination: { limit: number; offset: number }): Promise<{ rows: SertifikatMutu[]; count: number }> {
    return SertifikatMutu.findAndCountAll({
      limit: pagination.limit,
      offset: pagination.offset,
      order: [["created_at", "DESC"]],
    });
  }

  findAll(): Promise<SertifikatMutu[]> {
    return SertifikatMutu.findAll({ order: [["created_at", "DESC"]] });
  }

  findById(id: number): Promise<SertifikatMutu | null> {
    return SertifikatMutu.findByPk(id);
  }

  create(data: CreateSertifikatMutuDto, transaction?: Transaction): Promise<SertifikatMutu> {
    return SertifikatMutu.create(
      { sertifikatDescription: data.sertifikat_description ?? null },
      transaction ? { transaction } : {},
    );
  }

  async update(sertifikatMutu: SertifikatMutu, data: UpdateSertifikatMutuDto, transaction?: Transaction): Promise<SertifikatMutu> {
    await sertifikatMutu.update(
      { sertifikatDescription: data.sertifikat_description ?? null },
      transaction ? { transaction } : {},
    );
    return sertifikatMutu;
  }

  async delete(sertifikatMutu: SertifikatMutu, transaction?: Transaction): Promise<void> {
    await sertifikatMutu.destroy(transaction ? { transaction } : {});
  }
}
