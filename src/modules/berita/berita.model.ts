import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import { sanitizePlainText, sanitizeRichText } from "../../core/content/sanitize-html.js";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  Sequelize,
} from "sequelize";

export type BeritaKategori = "Pendanaan" | "Workshop" | "Panduan" | "Umum";

export class Berita extends Model<
  InferAttributes<Berita>,
  InferCreationAttributes<Berita>
> {
  declare id: CreationOptional<string>;
  declare judul: string;
  declare slug: string;
  declare isi_berita: string;
  declare photo_url: string | null;
  declare file_url: string | null;
  declare kategori: CreationOptional<BeritaKategori>;
  declare tanggal_rilis: Date | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}

function sanitizeBeritaFields(instance: Berita): void {
  if (instance.changed("judul")) {
    const sanitized = sanitizePlainText(instance.judul);
    instance.judul = sanitized ?? instance.judul;
  }

  if (instance.changed("isi_berita")) {
    const sanitized = sanitizeRichText(instance.isi_berita);
    instance.isi_berita = sanitized ?? instance.isi_berita;
  }
}

export function initModel(sequelize: Sequelize): typeof Berita {
  Berita.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => generateUuidV7(),
        primaryKey: true,
      },
      judul: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      isi_berita: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      photo_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      file_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      kategori: {
        type: DataTypes.ENUM("Pendanaan", "Workshop", "Panduan", "Umum"),
        allowNull: false,
        defaultValue: "Umum",
      },
      tanggal_rilis: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "deleted_at",
      },
    },
    {
      sequelize,
      modelName: "Berita",
      tableName: "berita",
      freezeTableName: true,
      underscored: false,
      paranoid: true,
      deletedAt: "deleted_at",
      indexes: [
        { name: "idx_berita_kategori", fields: ["kategori"] },
        { name: "idx_berita_createdAt", fields: ["createdAt"] },
      ],
      hooks: {
        beforeCreate: sanitizeBeritaFields,
        beforeUpdate: sanitizeBeritaFields,
      },
    },
  );

  return Berita;
}
