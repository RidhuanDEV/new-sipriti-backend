import { DataTypes, Model } from "sequelize";
import { sanitizeRichText } from "../../core/content/sanitize-html.js";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  Sequelize,
} from "sequelize";

export const DESKRIPSI_CAPAIAN_SECTION_KEYS = [
  "tentang_prpm",
  "publikasi_ilmiah",
  "hki_paten",
  "pengalaman_riset",
  "penghargaan_riset",
  "produk_riset",
  "sertifikasi_mutu",
] as const;

export type DeskripsiCapaianSectionKey = typeof DESKRIPSI_CAPAIAN_SECTION_KEYS[number];

export class DeskripsiCapaian extends Model<
  InferAttributes<DeskripsiCapaian>,
  InferCreationAttributes<DeskripsiCapaian>
> {
  declare id: CreationOptional<number>;
  declare section_key: DeskripsiCapaianSectionKey;
  declare content: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

function sanitizeDeskripsiFields(instance: DeskripsiCapaian): void {
  if (instance.changed("content")) {
    instance.content = sanitizeRichText(instance.content);
  }
}

export function initModel(sequelize: Sequelize): typeof DeskripsiCapaian {
  DeskripsiCapaian.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      section_key: {
        type: DataTypes.ENUM(...DESKRIPSI_CAPAIAN_SECTION_KEYS),
        allowNull: false,
        unique: true,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Deskripsi HTML dari RichTextEditor",
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "DeskripsiCapaian",
      tableName: "deskripsi_capaian",
      freezeTableName: true,
      indexes: [{ unique: true, fields: ["section_key"] }],
      hooks: {
        beforeCreate: sanitizeDeskripsiFields,
        beforeUpdate: sanitizeDeskripsiFields,
      },
    },
  );

  return DeskripsiCapaian;
}
