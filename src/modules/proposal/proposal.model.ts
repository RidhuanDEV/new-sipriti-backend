import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import type {
  BelongsToManySetAssociationsMixin,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
  Sequelize,
} from "sequelize";
import type { Output } from "../output/output.model.js";
import type { Prodi } from "../prodi/prodi.model.js";
import type { Skema } from "../skema/skema.model.js";
import type { TahunAkademik } from "../tahunakademik/tahunakademik.model.js";
import type { User } from "../user/user.model.js";
import type { JadwalProposal } from "../jadwal-proposal/jadwal-proposal.model.js";
import type { LuaranProposal } from "../luaran-proposal/luaran-proposal.model.js";
import type { MemberProposal } from "./member-proposal.model.js";
import type { LaporanUsulan } from "./laporan-usulan.model.js";
import type { PengabdianProposal } from "../pengabdian-proposal/pengabdian-proposal.model.js";
import type { PenelitianProposal } from "../penelitian-proposal/penelitian-proposal.model.js";
import type { RABProposal } from "../rab-proposal/rab-proposal.model.js";

export type ProposalTipeUsulan = "Penelitian" | "Pengabdian";
export type ProposalStatus = "Draft" | "Pending" | "Approved" | "Declined";
export type ProposalTipe = "umum" | "hibah_internal";
export type ProposalRevisionStatus =
  | "Belum Diperbaiki"
  | "Sudah Diperbaiki"
  | "Tidak Ada";

export class HakiProposal extends Model<
  InferAttributes<
    HakiProposal,
    {
      omit:
        | "ketua"
        | "members"
        | "rab"
        | "rabs"
        | "substansiPenelitian"
        | "substansiPengabdian"
        | "jadwalKegiatan"
        | "luaran"
        | "tahunAkademik"
        | "outputs"
        | "skema"
        | "prodiPengusulRelasi"
        | "setOutputs";
    }
  >,
  InferCreationAttributes<
    HakiProposal,
    {
      omit:
        | "ketua"
        | "members"
        | "rab"
        | "rabs"
        | "substansiPenelitian"
        | "substansiPengabdian"
        | "jadwalKegiatan"
        | "luaran"
        | "tahunAkademik"
        | "outputs"
        | "skema"
        | "prodiPengusulRelasi"
        | "setOutputs";
    }
  >
> {
  declare id: CreationOptional<string>;
  declare user_id: string;
  declare judul: string;
  declare prodi_pengusul: CreationOptional<string | null>;
  declare kelompok_skema: CreationOptional<string | null>;
  declare bidang_fokus: CreationOptional<string | null>;
  declare sumber_dana: CreationOptional<string | null>;
  declare jumlah_dana: CreationOptional<string | number | null>;
  declare keterlibatan_lain: CreationOptional<string | null>;
  declare tipe_usulan: CreationOptional<ProposalTipeUsulan>;
  declare status_usulan: CreationOptional<ProposalStatus>;
  declare skema_id: CreationOptional<string | null>;
  declare tahun_pelaksanaan: CreationOptional<string | null>;
  declare tipe: CreationOptional<ProposalTipe>;
  declare tahun_akademik_id: CreationOptional<string | null>;
  declare catatan_revisi: CreationOptional<string | null>;
  declare status_revisi: CreationOptional<ProposalRevisionStatus>;
  declare file_url: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare ketua?: NonAttribute<User>;
  declare members?: NonAttribute<MemberProposal[]>;
  declare rab?: NonAttribute<RABProposal[]>;
  declare rabs?: NonAttribute<RABProposal[]>;
  declare substansiPenelitian?: NonAttribute<PenelitianProposal | null>;
  declare substansiPengabdian?: NonAttribute<PengabdianProposal | null>;
  declare jadwalKegiatan?: NonAttribute<JadwalProposal[]>;
  declare luaran?: NonAttribute<LuaranProposal[]>;
  declare tahunAkademik?: NonAttribute<TahunAkademik | null>;
  declare outputs?: NonAttribute<Output[]>;
  declare skema?: NonAttribute<Skema | null>;
  declare prodiPengusulRelasi?: NonAttribute<Prodi | null>;
  declare laporanUsulan?: NonAttribute<LaporanUsulan[]>;
  declare setOutputs: BelongsToManySetAssociationsMixin<Output, string>;
}

export function initModel(sequelize: Sequelize): typeof HakiProposal {
  HakiProposal.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => generateUuidV7(),
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      judul: {
        type: DataTypes.STRING(1000),
        allowNull: false,
      },
      prodi_pengusul: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      kelompok_skema: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bidang_fokus: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      sumber_dana: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      jumlah_dana: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: true,
        defaultValue: 0,
      },
      keterlibatan_lain: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      tipe_usulan: {
        type: DataTypes.ENUM("Penelitian", "Pengabdian"),
        allowNull: false,
        defaultValue: "Penelitian",
      },
      status_usulan: {
        type: DataTypes.ENUM("Draft", "Pending", "Approved", "Declined"),
        allowNull: false,
        defaultValue: "Draft",
      },
      skema_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      tahun_pelaksanaan: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      tipe: {
        type: DataTypes.ENUM("umum", "hibah_internal"),
        allowNull: false,
        defaultValue: "umum",
      },
      tahun_akademik_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      catatan_revisi: {
        type: DataTypes.TEXT("long"),
        allowNull: true,
      },
      status_revisi: {
        type: DataTypes.ENUM("Belum Diperbaiki", "Sudah Diperbaiki", "Tidak Ada"),
        allowNull: false,
        defaultValue: "Tidak Ada",
      },
      file_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "HakiProposal",
      tableName: "haki_proposals",
      freezeTableName: true,
      timestamps: true,
      paranoid: false,
      underscored: false,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      indexes: [
        { name: "idx_hakiproposals_user_id", fields: ["user_id"] },
        { name: "idx_hakiproposals_tipe", fields: ["tipe_usulan"] },
        { name: "idx_hakiproposals_status", fields: ["status_usulan"] },
        { name: "idx_hakiproposals_skema", fields: ["skema_id"] },
        { name: "haki_proposals_prodi_pengusul_index", fields: ["prodi_pengusul"] },
      ],
    },
  );

  return HakiProposal;
}
