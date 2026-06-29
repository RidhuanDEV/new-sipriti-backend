import { User } from "../../modules/user/user.model.js";
import { Role } from "../../modules/roles/role.model.js";
import { Permission } from "../../modules/permissions/permission.model.js";
import { RolePermission } from "../../modules/roles/role-permission.model.js";
import { UserRole } from "../../modules/roles/user-role.model.js";
import { Prodi } from "../../modules/prodi/prodi.model.js";
import { UploadedFile } from "../../modules/files/uploaded-file.model.js";
import { TahunAkademik } from "../../modules/tahunakademik/tahunakademik.model.js";
import { KategoriPublikasi } from "../../modules/kategoripublikasi/kategoripublikasi.model.js";
import { Publikasi } from "../../modules/publikasi/publikasi.model.js";
import { HibahInternal } from "../../modules/hibahinternal/hibahinternal.model.js";
import { UserHibahinternalPair } from "../../modules/hibahinternal/user-hibahinternal-pair.model.js";
import { Notification } from "../../modules/notification/notification.model.js";
import { JadwalBulanan } from "../../modules/jadwal-proposal/jadwal-bulanan.model.js";
import { JadwalProposal } from "../../modules/jadwal-proposal/jadwal-proposal.model.js";
import { LuaranProposal } from "../../modules/luaran-proposal/luaran-proposal.model.js";
import { PengabdianProposal } from "../../modules/pengabdian-proposal/pengabdian-proposal.model.js";
import { PenelitianProposal } from "../../modules/penelitian-proposal/penelitian-proposal.model.js";
import { HakiProposalOutput } from "../../modules/proposal/haki-proposal-output.model.js";
import { LaporanUsulan } from "../../modules/proposal/laporan-usulan.model.js";
import { Mahasiswa } from "../../modules/proposal/mahasiswa.model.js";
import { MemberProposal } from "../../modules/proposal/member-proposal.model.js";
import { HakiProposal } from "../../modules/proposal/proposal.model.js";
import { RABProposal } from "../../modules/rab-proposal/rab-proposal.model.js";
import { Output } from "../../modules/output/output.model.js";
import { OfficialSignature } from "../../modules/official-signatures/official-signature.model.js";
import { HKI } from "../../modules/hki/hki.model.js";
import { Monev } from "../../modules/monev-internal/monev.model.js";

export function setupAssociations(): void {
  User.belongsTo(Role, { foreignKey: "roleId", as: "role" });
  Role.hasMany(User, { foreignKey: "roleId", as: "users" });

  Role.belongsToMany(Permission, {
    through: RolePermission,
    foreignKey: "roleId",
    otherKey: "permissionId",
    as: "permissions",
  });

  Permission.belongsToMany(Role, {
    through: RolePermission,
    foreignKey: "permissionId",
    otherKey: "roleId",
    as: "roles",
  });

  User.belongsToMany(Role, {
    through: UserRole,
    foreignKey: "userId",
    otherKey: "roleId",
    as: "roles",
  });

  Role.belongsToMany(User, {
    through: UserRole,
    foreignKey: "roleId",
    otherKey: "userId",
    as: "members",
  });

  User.belongsTo(Prodi, {
    foreignKey: "prodiKode",
    targetKey: "kodeProdi",
    as: "prodiRelation",
  });

  Prodi.hasMany(User, {
    foreignKey: "prodiKode",
    sourceKey: "kodeProdi",
    as: "users",
  });

  UploadedFile.belongsTo(User, {
    foreignKey: "ownerUserId",
    as: "owner",
  });

  User.hasMany(UploadedFile, {
    foreignKey: "ownerUserId",
    as: "uploadedFiles",
  });

  TahunAkademik.hasMany(Publikasi, {
    foreignKey: "tahunAkademikId",
    as: "publikasi",
  });

  Publikasi.belongsTo(TahunAkademik, {
    foreignKey: "tahunAkademikId",
    as: "tahunAkademik",
  });

  KategoriPublikasi.hasMany(Publikasi, {
    foreignKey: "kategoriPublikasiId",
    as: "publikasi",
  });

  Publikasi.belongsTo(KategoriPublikasi, {
    foreignKey: "kategoriPublikasiId",
    as: "kategori",
  });

  HibahInternal.belongsToMany(User, {
    through: UserHibahinternalPair,
    foreignKey: "hibah_internal_id",
    otherKey: "user_id",
    as: "users",
  });

  User.belongsToMany(HibahInternal, {
    through: UserHibahinternalPair,
    foreignKey: "user_id",
    otherKey: "hibah_internal_id",
    as: "hibahInternals",
  });

  HakiProposal.belongsTo(User, { foreignKey: "user_id", as: "ketua" });
  User.hasMany(HakiProposal, { foreignKey: "user_id", as: "proposals" });
  HakiProposal.hasMany(MemberProposal, { foreignKey: "haki_proposal_id", sourceKey: "id", as: "members" });
  MemberProposal.belongsTo(HakiProposal, { foreignKey: "haki_proposal_id", targetKey: "id", as: "proposal" });
  MemberProposal.belongsTo(User, { foreignKey: "no_identitas", targetKey: "nidn", as: "user", constraints: false });
  MemberProposal.belongsTo(Mahasiswa, { foreignKey: "no_identitas", targetKey: "nrp", as: "mahasiswa", constraints: false });
  MemberProposal.belongsTo(User, { foreignKey: "invited_by_user_id", as: "inviter" });
  MemberProposal.belongsTo(Prodi, { foreignKey: "prodi_kode_anggota", targetKey: "kodeProdi", as: "prodiAnggotaRelasi", constraints: false });
  Mahasiswa.belongsTo(Prodi, { foreignKey: "prodi_kode", targetKey: "kodeProdi", as: "prodiRelasi" });
  Mahasiswa.hasOne(User, { foreignKey: "nidn", sourceKey: "nrp", as: "akun", constraints: false });
  Notification.belongsTo(User, { foreignKey: "user_id", as: "user" });
  User.hasMany(Notification, { foreignKey: "user_id", as: "notifications" });
  HakiProposal.hasMany(RABProposal, { foreignKey: "haki_proposal_id", as: "rab" });
  HakiProposal.hasMany(RABProposal, { foreignKey: "haki_proposal_id", as: "rabs" });
  RABProposal.belongsTo(HakiProposal, { foreignKey: "haki_proposal_id", as: "proposal" });
  HakiProposal.hasOne(PenelitianProposal, { foreignKey: "haki_proposal_id", as: "substansiPenelitian" });
  PenelitianProposal.belongsTo(HakiProposal, { foreignKey: "haki_proposal_id", as: "proposal" });
  HakiProposal.hasOne(PengabdianProposal, { foreignKey: "haki_proposal_id", as: "substansiPengabdian" });
  PengabdianProposal.belongsTo(HakiProposal, { foreignKey: "haki_proposal_id", as: "proposal" });
  HakiProposal.hasMany(JadwalProposal, { foreignKey: "haki_proposal_id", as: "jadwalKegiatan" });
  JadwalProposal.belongsTo(HakiProposal, { foreignKey: "haki_proposal_id", as: "proposal" });
  JadwalProposal.hasMany(JadwalBulanan, { foreignKey: "jadwal_id", as: "bulanAktif" });
  JadwalBulanan.belongsTo(JadwalProposal, { foreignKey: "jadwal_id", as: "kegiatan" });
  HakiProposal.hasMany(LuaranProposal, { foreignKey: "haki_proposal_id", as: "luaran" });
  LuaranProposal.belongsTo(HakiProposal, { foreignKey: "haki_proposal_id", as: "proposal" });
  HakiProposal.belongsTo(TahunAkademik, { foreignKey: "tahun_akademik_id", as: "tahunAkademik" });
  TahunAkademik.hasMany(HakiProposal, { foreignKey: "tahun_akademik_id", as: "proposals" });
  HakiProposal.belongsTo(Prodi, { foreignKey: "prodi_pengusul", targetKey: "kodeProdi", as: "prodiPengusulRelasi" });
  Prodi.hasMany(HakiProposal, { foreignKey: "prodi_pengusul", sourceKey: "kodeProdi", as: "proposalPengusul" });
  HakiProposal.hasMany(LaporanUsulan, { foreignKey: "haki_proposal_id", as: "laporanUsulan" });
  LaporanUsulan.belongsTo(HakiProposal, { foreignKey: "haki_proposal_id", as: "proposal" });
  LaporanUsulan.belongsTo(User, { foreignKey: "ketua_user_id", as: "ketua" });
  HakiProposal.belongsToMany(Output, { through: HakiProposalOutput, foreignKey: "haki_proposal_id", otherKey: "output_id", as: "outputs" });
  Output.belongsToMany(HakiProposal, { through: HakiProposalOutput, foreignKey: "output_id", otherKey: "haki_proposal_id", as: "proposals" });
  LaporanUsulan.belongsTo(User, { foreignKey: "validated_by", as: "validator" });
  OfficialSignature.belongsTo(User, { foreignKey: "uploaded_by", as: "uploadedByUser" });
  OfficialSignature.belongsTo(User, { foreignKey: "updated_by", as: "updatedByUser" });
  OfficialSignature.belongsTo(Prodi, { foreignKey: "kode_prodi", targetKey: "kodeProdi", as: "prodi", constraints: false });
  HKI.belongsTo(User, { foreignKey: "user_id", as: "user" });
  User.hasMany(HKI, { foreignKey: "user_id", as: "hkis" });
  Monev.belongsTo(HakiProposal, { foreignKey: "usulan_id", as: "usulan" });
  HakiProposal.hasMany(Monev, { foreignKey: "usulan_id", as: "monevs" });
}
