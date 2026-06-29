import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
  Sequelize,
} from "sequelize";
import type { JadwalBulanan } from "./jadwal-bulanan.model.js";

export class JadwalProposal extends Model<
  InferAttributes<JadwalProposal, { omit: "bulanAktif" }>,
  InferCreationAttributes<JadwalProposal, { omit: "bulanAktif" }>
> {
  declare id: CreationOptional<string>;
  declare haki_proposal_id: string;
  declare nama_kegiatan: string;
  declare tahun: CreationOptional<number>;
  declare urutan: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare bulanAktif?: NonAttribute<JadwalBulanan[]>;
}

export function initModel(sequelize: Sequelize): typeof JadwalProposal {
  JadwalProposal.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => generateUuidV7(),
        primaryKey: true,
      },
      haki_proposal_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      nama_kegiatan: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      tahun: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      urutan: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "JadwalProposal",
      tableName: "jadwal_proposal",
      freezeTableName: true,
      paranoid: false,
      indexes: [{ name: "idx_jproposal_haki", fields: ["haki_proposal_id"] }],
    },
  );

  return JadwalProposal;
}
