import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import { sanitizePlainText, sanitizeRichText } from "../../core/content/sanitize-html.js";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  Sequelize,
} from "sequelize";

export class Pengumuman extends Model<
  InferAttributes<Pengumuman>,
  InferCreationAttributes<Pengumuman>
> {
  declare id: CreationOptional<string>;
  declare judul: string;
  declare slug: string;
  declare isi_pengumuman: string;
  declare gambar: string | null;
  declare file_lampiran: string | null;
  declare tanggal_rilis: Date | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}

function sanitizePengumumanFields(instance: Pengumuman): void {
  if (instance.changed("judul")) {
    const sanitized = sanitizePlainText(instance.judul);
    instance.judul = sanitized ?? instance.judul;
  }

  if (instance.changed("isi_pengumuman")) {
    const sanitized = sanitizeRichText(instance.isi_pengumuman);
    instance.isi_pengumuman = sanitized ?? instance.isi_pengumuman;
  }
}

export function initModel(sequelize: Sequelize): typeof Pengumuman {
  Pengumuman.init(
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
      isi_pengumuman: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      gambar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      file_lampiran: {
        type: DataTypes.STRING,
        allowNull: true,
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
      modelName: "Pengumuman",
      tableName: "pengumuman",
      freezeTableName: true,
      underscored: false,
      paranoid: true,
      deletedAt: "deleted_at",
      hooks: {
        beforeCreate: sanitizePengumumanFields,
        beforeUpdate: sanitizePengumumanFields,
      },
    },
  );

  return Pengumuman;
}
