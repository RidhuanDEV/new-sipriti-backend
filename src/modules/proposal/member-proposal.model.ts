import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
  Sequelize,
} from "sequelize";
import type { Prodi } from "../prodi/prodi.model.js";
import type { User } from "../user/user.model.js";
import type { HakiProposal } from "./proposal.model.js";
import type { Mahasiswa } from "./mahasiswa.model.js";

export type MemberProposalPeran = "Ketua" | "Anggota";
export type MemberProposalStatus = "Mahasiswa" | "Dosen";
export type MemberProposalInviteStatus = "pending" | "accepted" | "rejected";

export class MemberProposal extends Model<
  InferAttributes<MemberProposal, { omit: "proposal" | "user" | "mahasiswa" | "inviter" | "prodiAnggotaRelasi" }>,
  InferCreationAttributes<MemberProposal, { omit: "proposal" | "user" | "mahasiswa" | "inviter" | "prodiAnggotaRelasi" }>
> {
  declare id: CreationOptional<string>;
  declare haki_proposal_id: string;
  declare no_identitas: CreationOptional<string | null>;
  declare peran: CreationOptional<MemberProposalPeran | null>;
  declare status: CreationOptional<MemberProposalStatus | null>;
  declare bidang_tugas: CreationOptional<string | null>;
  declare status_invite: CreationOptional<MemberProposalInviteStatus | null>;
  declare invited_by_user_id: CreationOptional<string | null>;
  declare nama_anggota: CreationOptional<string | null>;
  declare institusi_anggota: CreationOptional<string | null>;
  declare prodi_anggota: CreationOptional<string | null>;
  declare prodi_kode_anggota: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare proposal?: NonAttribute<HakiProposal>;
  declare user?: NonAttribute<User | null>;
  declare mahasiswa?: NonAttribute<Mahasiswa | null>;
  declare inviter?: NonAttribute<User | null>;
  declare prodiAnggotaRelasi?: NonAttribute<Prodi | null>;
}

export function initModel(sequelize: Sequelize): typeof MemberProposal {
  MemberProposal.init(
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
      no_identitas: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      peran: {
        type: DataTypes.ENUM("Ketua", "Anggota"),
        defaultValue: "Anggota",
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("Mahasiswa", "Dosen"),
        defaultValue: "Dosen",
        allowNull: true,
      },
      bidang_tugas: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status_invite: {
        type: DataTypes.ENUM("pending", "accepted", "rejected"),
        defaultValue: "accepted",
        allowNull: true,
      },
      invited_by_user_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      nama_anggota: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      institusi_anggota: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      prodi_anggota: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      prodi_kode_anggota: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "MemberProposal",
      tableName: "memberproposals",
      freezeTableName: true,
      paranoid: false,
      underscored: false,
      indexes: [
        { name: "idx_memberproposals_no_identitas", fields: ["no_identitas"] },
        { name: "idx_memberproposals_proposal_id", fields: ["haki_proposal_id"] },
        {
          name: "uniq_memberproposals_proposal_identitas",
          unique: true,
          fields: ["haki_proposal_id", "no_identitas"],
        },
        { name: "idx_memberproposals_prodi_kode_anggota", fields: ["prodi_kode_anggota"] },
      ],
    },
  );

  return MemberProposal;
}
