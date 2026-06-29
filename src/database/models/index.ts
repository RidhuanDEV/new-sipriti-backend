import { logger } from "../../core/logger/logger.js";
import { Role, initModel as initRole } from "../../modules/roles/role.model.js";
import { Permission, initModel as initPermission } from "../../modules/permissions/permission.model.js";
import { RolePermission, initModel as initRolePermission } from "../../modules/roles/role-permission.model.js";
import { UserRole, initModel as initUserRole } from "../../modules/roles/user-role.model.js";
import { Prodi, initModel as initProdi } from "../../modules/prodi/prodi.model.js";
import { Skema, initModel as initSkema } from "../../modules/skema/skema.model.js";
import { BidangFokus, initModel as initBidangFokus } from "../../modules/bidangfokus/bidangfokus.model.js";
import { TahunAkademik, initModel as initTahunAkademik } from "../../modules/tahunakademik/tahunakademik.model.js";
import { Output, initModel as initOutput } from "../../modules/output/output.model.js";
import { SertifikatMutu, initModel as initSertifikatMutu } from "../../modules/sertifikatmutu/sertifikatmutu.model.js";
import { User, initModel as initUser } from "../../modules/user/user.model.js";
import { UploadedFile, initModel as initUploadedFile } from "../../modules/files/uploaded-file.model.js";
import { Berita, initModel as initBerita } from "../../modules/berita/berita.model.js";
import { Pengumuman, initModel as initPengumuman } from "../../modules/pengumuman/pengumuman.model.js";
import { Panduan, initModel as initPanduan } from "../../modules/panduan/panduan.model.js";
import { Carousel, initModel as initCarousel } from "../../modules/carousel/carousel.model.js";
import { LandingSlider, initModel as initLandingSlider } from "../../modules/landingslider/landingslider.model.js";
import { DeskripsiCapaian, initModel as initDeskripsiCapaian } from "../../modules/capaian/deskripsicapaian.model.js";
import { KategoriPublikasi, initModel as initKategoriPublikasi } from "../../modules/kategoripublikasi/kategoripublikasi.model.js";
import { Publikasi, initModel as initPublikasi } from "../../modules/publikasi/publikasi.model.js";
import { MitraKerjaRiset, initModel as initMitraKerjaRiset } from "../../modules/mitrakerjariset/mitrakerjariset.model.js";
import { ProductRiset, initModel as initProductRiset } from "../../modules/productriset/productriset.model.js";
import { PenghargaanRiset, initModel as initPenghargaanRiset } from "../../modules/penghargaanriset/penghargaanriset.model.js";
import { HibahInternal, initModel as initHibahInternal } from "../../modules/hibahinternal/hibahinternal.model.js";
import { UserHibahinternalPair, initModel as initUserHibahinternalPair } from "../../modules/hibahinternal/user-hibahinternal-pair.model.js";
import { Notification, initModel as initNotification } from "../../modules/notification/notification.model.js";
import { JadwalBulanan, initModel as initJadwalBulanan } from "../../modules/jadwal-proposal/jadwal-bulanan.model.js";
import { JadwalProposal, initModel as initJadwalProposal } from "../../modules/jadwal-proposal/jadwal-proposal.model.js";
import { LuaranProposal, initModel as initLuaranProposal } from "../../modules/luaran-proposal/luaran-proposal.model.js";
import { PengabdianProposal, initModel as initPengabdianProposal } from "../../modules/pengabdian-proposal/pengabdian-proposal.model.js";
import { PenelitianProposal, initModel as initPenelitianProposal } from "../../modules/penelitian-proposal/penelitian-proposal.model.js";
import { HakiProposalOutput, initModel as initHakiProposalOutput } from "../../modules/proposal/haki-proposal-output.model.js";
import { LaporanUsulan, initModel as initLaporanUsulan } from "../../modules/proposal/laporan-usulan.model.js";
import { Mahasiswa, initModel as initMahasiswa } from "../../modules/proposal/mahasiswa.model.js";
import { MemberProposal, initModel as initMemberProposal } from "../../modules/proposal/member-proposal.model.js";
import { HakiProposal, initModel as initHakiProposal } from "../../modules/proposal/proposal.model.js";
import { RABProposal, initModel as initRABProposal } from "../../modules/rab-proposal/rab-proposal.model.js";
import { OfficialSignature, initModel as initOfficialSignature } from "../../modules/official-signatures/official-signature.model.js";
import { HKI, initModel as initHKI } from "../../modules/hki/hki.model.js";
import { Monev, initModel as initMonev } from "../../modules/monev-internal/monev.model.js";
import { AuditLog, initModel as initAuditLog } from "../../core/audit/audit-log.model.js";
import type { Sequelize } from "sequelize";

export async function loadModels(sequelize: Sequelize): Promise<void> {
  // Initialize models with the Sequelize instance
  initRole(sequelize);
  initPermission(sequelize);
  initRolePermission(sequelize);
  initUserRole(sequelize);
  initProdi(sequelize);
  initSkema(sequelize);
  initBidangFokus(sequelize);
  initTahunAkademik(sequelize);
  initOutput(sequelize);
  initSertifikatMutu(sequelize);
  initUser(sequelize);
  initUploadedFile(sequelize);
  initBerita(sequelize);
  initPengumuman(sequelize);
  initPanduan(sequelize);
  initCarousel(sequelize);
  initLandingSlider(sequelize);
  initDeskripsiCapaian(sequelize);
  initKategoriPublikasi(sequelize);
  initPublikasi(sequelize);
  initMitraKerjaRiset(sequelize);
  initProductRiset(sequelize);
  initPenghargaanRiset(sequelize);
  initHibahInternal(sequelize);
  initUserHibahinternalPair(sequelize);
  initHakiProposal(sequelize);
  initMemberProposal(sequelize);
  initMahasiswa(sequelize);
  initNotification(sequelize);
  initHakiProposalOutput(sequelize);
  initLaporanUsulan(sequelize);
  initPenelitianProposal(sequelize);
  initPengabdianProposal(sequelize);
  initJadwalProposal(sequelize);
  initJadwalBulanan(sequelize);
  initLuaranProposal(sequelize);
  initRABProposal(sequelize);
  initOfficialSignature(sequelize);
  initHKI(sequelize);
  initMonev(sequelize);
  initAuditLog(sequelize);

  const models = [
    Role,
    Permission,
    RolePermission,
    UserRole,
    Prodi,
    Skema,
    BidangFokus,
    TahunAkademik,
    Output,
    SertifikatMutu,
    User,
    UploadedFile,
    Berita,
    Pengumuman,
    Panduan,
    Carousel,
    LandingSlider,
    DeskripsiCapaian,
    KategoriPublikasi,
    Publikasi,
    MitraKerjaRiset,
    ProductRiset,
    PenghargaanRiset,
    HibahInternal,
    UserHibahinternalPair,
    HakiProposal,
    MemberProposal,
    Mahasiswa,
    Notification,
    HakiProposalOutput,
    LaporanUsulan,
    PenelitianProposal,
    PengabdianProposal,
    JadwalProposal,
    JadwalBulanan,
    LuaranProposal,
    RABProposal,
    OfficialSignature,
    HKI,
    Monev,
    AuditLog,
  ];

  for (const model of models) {
    logger.info(`Loaded Model: ${model.name.toLowerCase()}.model.ts`);
  }

  // Configure Associations
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

  User.belongsTo(Role, {
    foreignKey: "roleId",
    as: "role",
  });

  Role.hasMany(User, {
    foreignKey: "roleId",
    as: "users",
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

  HakiProposal.hasMany(MemberProposal, {
    foreignKey: "haki_proposal_id",
    sourceKey: "id",
    as: "members",
  });
  MemberProposal.belongsTo(HakiProposal, {
    foreignKey: "haki_proposal_id",
    targetKey: "id",
    as: "proposal",
  });
  MemberProposal.belongsTo(User, {
    foreignKey: "no_identitas",
    targetKey: "nidn",
    as: "user",
    constraints: false,
  });
  MemberProposal.belongsTo(Mahasiswa, {
    foreignKey: "no_identitas",
    targetKey: "nrp",
    as: "mahasiswa",
    constraints: false,
  });
  MemberProposal.belongsTo(User, {
    foreignKey: "invited_by_user_id",
    as: "inviter",
  });
  MemberProposal.belongsTo(Prodi, {
    foreignKey: "prodi_kode_anggota",
    targetKey: "kodeProdi",
    as: "prodiAnggotaRelasi",
    constraints: false,
  });

  Mahasiswa.belongsTo(Prodi, {
    foreignKey: "prodi_kode",
    targetKey: "kodeProdi",
    as: "prodiRelasi",
  });
  Mahasiswa.hasOne(User, {
    foreignKey: "nidn",
    sourceKey: "nrp",
    as: "akun",
    constraints: false,
  });

  Notification.belongsTo(User, { foreignKey: "user_id", as: "user" });
  User.hasMany(Notification, { foreignKey: "user_id", as: "notifications" });

  HakiProposal.hasMany(RABProposal, { foreignKey: "haki_proposal_id", as: "rab" });
  HakiProposal.hasMany(RABProposal, { foreignKey: "haki_proposal_id", as: "rabs" });
  RABProposal.belongsTo(HakiProposal, { foreignKey: "haki_proposal_id", as: "proposal" });

  HakiProposal.hasOne(PenelitianProposal, {
    foreignKey: "haki_proposal_id",
    as: "substansiPenelitian",
  });
  PenelitianProposal.belongsTo(HakiProposal, {
    foreignKey: "haki_proposal_id",
    as: "proposal",
  });

  HakiProposal.hasOne(PengabdianProposal, {
    foreignKey: "haki_proposal_id",
    as: "substansiPengabdian",
  });
  PengabdianProposal.belongsTo(HakiProposal, {
    foreignKey: "haki_proposal_id",
    as: "proposal",
  });

  HakiProposal.hasMany(JadwalProposal, {
    foreignKey: "haki_proposal_id",
    as: "jadwalKegiatan",
  });
  JadwalProposal.belongsTo(HakiProposal, { foreignKey: "haki_proposal_id", as: "proposal" });
  JadwalProposal.hasMany(JadwalBulanan, { foreignKey: "jadwal_id", as: "bulanAktif" });
  JadwalBulanan.belongsTo(JadwalProposal, { foreignKey: "jadwal_id", as: "kegiatan" });

  HakiProposal.hasMany(LuaranProposal, { foreignKey: "haki_proposal_id", as: "luaran" });
  LuaranProposal.belongsTo(HakiProposal, { foreignKey: "haki_proposal_id", as: "proposal" });

  HakiProposal.belongsTo(TahunAkademik, { foreignKey: "tahun_akademik_id", as: "tahunAkademik" });
  TahunAkademik.hasMany(HakiProposal, { foreignKey: "tahun_akademik_id", as: "proposals" });
  HakiProposal.belongsTo(Skema, { foreignKey: "skema_id", as: "skema" });
  Skema.hasMany(HakiProposal, { foreignKey: "skema_id", as: "proposals" });
  HakiProposal.belongsTo(Prodi, {
    foreignKey: "prodi_pengusul",
    targetKey: "kodeProdi",
    as: "prodiPengusulRelasi",
  });
  Prodi.hasMany(HakiProposal, {
    foreignKey: "prodi_pengusul",
    sourceKey: "kodeProdi",
    as: "proposalPengusul",
  });
  HakiProposal.hasMany(LaporanUsulan, { foreignKey: "haki_proposal_id", as: "laporanUsulan" });
  LaporanUsulan.belongsTo(HakiProposal, { foreignKey: "haki_proposal_id", as: "proposal" });
  LaporanUsulan.belongsTo(User, { foreignKey: "ketua_user_id", as: "ketua" });

  HakiProposal.belongsToMany(Output, {
    through: HakiProposalOutput,
    foreignKey: "haki_proposal_id",
    otherKey: "output_id",
    as: "outputs",
  });
  Output.belongsToMany(HakiProposal, {
    through: HakiProposalOutput,
    foreignKey: "output_id",
    otherKey: "haki_proposal_id",
    as: "proposals",
  });

  LaporanUsulan.belongsTo(User, { foreignKey: "validated_by", as: "validator" });
  OfficialSignature.belongsTo(User, { foreignKey: "uploaded_by", as: "uploadedByUser" });
  OfficialSignature.belongsTo(User, { foreignKey: "updated_by", as: "updatedByUser" });
  OfficialSignature.belongsTo(Prodi, {
    foreignKey: "kode_prodi",
    targetKey: "kodeProdi",
    as: "prodi",
    constraints: false,
  });
  HKI.belongsTo(User, { foreignKey: "user_id", as: "user" });
  User.hasMany(HKI, { foreignKey: "user_id", as: "hkis" });
  Monev.belongsTo(HakiProposal, { foreignKey: "usulan_id", as: "usulan" });
  HakiProposal.hasMany(Monev, { foreignKey: "usulan_id", as: "monevs" });

  logger.info("Model associations configured");
}
