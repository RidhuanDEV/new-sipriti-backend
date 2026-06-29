import type { QueryInterface, QueryInterfaceIndexOptions } from "sequelize";
import { DataTypes, QueryTypes } from "sequelize";

interface ExistsRow {
  found: number;
}

async function tableExists(queryInterface: QueryInterface, tableName: string): Promise<boolean> {
  const rows = await queryInterface.sequelize.query<ExistsRow>(
    "SELECT 1 AS found FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = :tableName LIMIT 1",
    { type: QueryTypes.SELECT, replacements: { tableName } },
  );
  return rows.length > 0;
}

async function columnExists(queryInterface: QueryInterface, tableName: string, columnName: string): Promise<boolean> {
  const rows = await queryInterface.sequelize.query<ExistsRow>(
    "SELECT 1 AS found FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = :tableName AND column_name = :columnName LIMIT 1",
    { type: QueryTypes.SELECT, replacements: { tableName, columnName } },
  );
  return rows.length > 0;
}

async function indexExists(queryInterface: QueryInterface, tableName: string, indexName: string): Promise<boolean> {
  const rows = await queryInterface.sequelize.query<ExistsRow>(
    "SELECT 1 AS found FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = :tableName AND index_name = :indexName LIMIT 1",
    { type: QueryTypes.SELECT, replacements: { tableName, indexName } },
  );
  return rows.length > 0;
}

async function addColumnIfMissing(
  queryInterface: QueryInterface,
  tableName: string,
  columnName: string,
  definition: Parameters<QueryInterface["addColumn"]>[2],
): Promise<void> {
  if (!(await columnExists(queryInterface, tableName, columnName))) {
    await queryInterface.addColumn(tableName, columnName, definition);
  }
}

async function addIndexIfMissing(
  queryInterface: QueryInterface,
  tableName: string,
  fields: string[],
  options: QueryInterfaceIndexOptions & { name: string },
): Promise<void> {
  if (!(await indexExists(queryInterface, tableName, options.name))) {
    await queryInterface.addIndex(tableName, fields, options);
  }
}

const uuidPk = { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, primaryKey: true };
const timestampsCamel = {
  createdAt: { type: DataTypes.DATE, allowNull: false },
  updatedAt: { type: DataTypes.DATE, allowNull: false },
};
const timestampsSnake = {
  created_at: { type: DataTypes.DATE, allowNull: false },
  updated_at: { type: DataTypes.DATE, allowNull: false },
};

export async function up(queryInterface: QueryInterface): Promise<void> {
  if (!(await tableExists(queryInterface, "haki_proposals"))) {
    await queryInterface.createTable("haki_proposals", {
      id: uuidPk,
      user_id: { type: DataTypes.UUID, allowNull: false },
      judul: { type: DataTypes.STRING(1000), allowNull: false },
      prodi_pengusul: { type: DataTypes.STRING(20), allowNull: true },
      kelompok_skema: { type: DataTypes.STRING, allowNull: true },
      bidang_fokus: { type: DataTypes.STRING, allowNull: true },
      sumber_dana: { type: DataTypes.STRING(200), allowNull: true },
      jumlah_dana: { type: DataTypes.DECIMAL(20, 2), allowNull: true, defaultValue: 0 },
      keterlibatan_lain: { type: DataTypes.TEXT, allowNull: true },
      tipe_usulan: { type: DataTypes.ENUM("Penelitian", "Pengabdian"), allowNull: false, defaultValue: "Penelitian" },
      status_usulan: { type: DataTypes.ENUM("Draft", "Pending", "Approved", "Declined"), allowNull: false, defaultValue: "Draft" },
      skema_id: { type: DataTypes.UUID, allowNull: true },
      tahun_pelaksanaan: { type: DataTypes.STRING(20), allowNull: true },
      tipe: { type: DataTypes.ENUM("umum", "hibah_internal"), allowNull: false, defaultValue: "umum" },
      tahun_akademik_id: { type: DataTypes.UUID, allowNull: true },
      catatan_revisi: { type: DataTypes.TEXT("long"), allowNull: true },
      status_revisi: { type: DataTypes.ENUM("Belum Diperbaiki", "Sudah Diperbaiki", "Tidak Ada"), allowNull: false, defaultValue: "Tidak Ada" },
      file_url: { type: DataTypes.STRING(500), allowNull: true },
      ...timestampsCamel,
    });
  } else {
    await addColumnIfMissing(queryInterface, "haki_proposals", "file_url", { type: DataTypes.STRING(500), allowNull: true });
    await addColumnIfMissing(queryInterface, "haki_proposals", "prodi_pengusul", { type: DataTypes.STRING(20), allowNull: true });
    await addColumnIfMissing(queryInterface, "haki_proposals", "tahun_akademik_id", { type: DataTypes.UUID, allowNull: true });
    await addColumnIfMissing(queryInterface, "haki_proposals", "catatan_revisi", { type: DataTypes.TEXT("long"), allowNull: true });
    await addColumnIfMissing(queryInterface, "haki_proposals", "status_revisi", { type: DataTypes.ENUM("Belum Diperbaiki", "Sudah Diperbaiki", "Tidak Ada"), allowNull: false, defaultValue: "Tidak Ada" });
  }

  if (!(await tableExists(queryInterface, "memberproposals"))) {
    await queryInterface.createTable("memberproposals", {
      id: uuidPk,
      haki_proposal_id: { type: DataTypes.UUID, allowNull: false },
      no_identitas: { type: DataTypes.STRING, allowNull: true },
      peran: { type: DataTypes.ENUM("Ketua", "Anggota"), allowNull: true, defaultValue: "Anggota" },
      status: { type: DataTypes.ENUM("Mahasiswa", "Dosen"), allowNull: true, defaultValue: "Dosen" },
      bidang_tugas: { type: DataTypes.TEXT, allowNull: true },
      status_invite: { type: DataTypes.ENUM("pending", "accepted", "rejected"), allowNull: true, defaultValue: "accepted" },
      invited_by_user_id: { type: DataTypes.UUID, allowNull: true },
      nama_anggota: { type: DataTypes.STRING, allowNull: true },
      institusi_anggota: { type: DataTypes.STRING, allowNull: true },
      prodi_anggota: { type: DataTypes.STRING, allowNull: true },
      prodi_kode_anggota: { type: DataTypes.STRING(20), allowNull: true },
      ...timestampsCamel,
    });
  } else {
    await addColumnIfMissing(queryInterface, "memberproposals", "status", { type: DataTypes.ENUM("Mahasiswa", "Dosen"), allowNull: true, defaultValue: "Dosen" });
    await addColumnIfMissing(queryInterface, "memberproposals", "bidang_tugas", { type: DataTypes.TEXT, allowNull: true });
    await addColumnIfMissing(queryInterface, "memberproposals", "nama_anggota", { type: DataTypes.STRING, allowNull: true });
    await addColumnIfMissing(queryInterface, "memberproposals", "institusi_anggota", { type: DataTypes.STRING, allowNull: true });
    await addColumnIfMissing(queryInterface, "memberproposals", "prodi_anggota", { type: DataTypes.STRING, allowNull: true });
    await addColumnIfMissing(queryInterface, "memberproposals", "prodi_kode_anggota", { type: DataTypes.STRING(20), allowNull: true });
  }

  if (!(await tableExists(queryInterface, "mahasiswas"))) {
    await queryInterface.createTable("mahasiswas", {
      id: uuidPk,
      nrp: { type: DataTypes.STRING, allowNull: false, unique: true },
      nama: { type: DataTypes.STRING, allowNull: false },
      prodi_kode: { type: DataTypes.STRING(20), allowNull: true },
      ...timestampsSnake,
    });
  }

  if (!(await tableExists(queryInterface, "notifications"))) {
    await queryInterface.createTable("notifications", {
      id: uuidPk,
      user_id: { type: DataTypes.UUID, allowNull: true },
      type: { type: DataTypes.ENUM("invite_anggota", "invite_accepted", "invite_rejected", "usulan_approved", "usulan_rejected"), allowNull: false },
      related_type: { type: DataTypes.ENUM("member_proposal", "haki_proposal"), allowNull: true },
      related_id: { type: DataTypes.UUID, allowNull: true },
      title: { type: DataTypes.STRING(255), allowNull: false },
      message: { type: DataTypes.TEXT, allowNull: false },
      status: { type: DataTypes.ENUM("unread", "read"), allowNull: false, defaultValue: "unread" },
      metadata: { type: DataTypes.JSON, allowNull: true },
      ...timestampsCamel,
    });
  }

  if (!(await tableExists(queryInterface, "tbl_penelitian_proposals"))) {
    await queryInterface.createTable("tbl_penelitian_proposals", {
      id: uuidPk,
      haki_proposal_id: { type: DataTypes.UUID, allowNull: false, unique: true },
      ringkasan: { type: DataTypes.TEXT("long"), allowNull: true },
      kata_kunci: { type: DataTypes.JSON, allowNull: true },
      pendahuluan: { type: DataTypes.TEXT("long"), allowNull: true },
      metode: { type: DataTypes.TEXT("long"), allowNull: true },
      daftar_pustaka: { type: DataTypes.TEXT("long"), allowNull: true },
      ...timestampsCamel,
    });
  }

  if (!(await tableExists(queryInterface, "tbl_pengabdian_proposals"))) {
    await queryInterface.createTable("tbl_pengabdian_proposals", {
      id: uuidPk,
      haki_proposal_id: { type: DataTypes.UUID, allowNull: false, unique: true },
      tingkat: { type: DataTypes.ENUM("Lokal", "Nasional", "Internasional"), allowNull: true },
      ringkasan: { type: DataTypes.TEXT("long"), allowNull: true },
      kata_kunci: { type: DataTypes.JSON, allowNull: true },
      pendahuluan: { type: DataTypes.TEXT("long"), allowNull: true },
      permasalahan_dan_solusi: { type: DataTypes.TEXT("long"), allowNull: true },
      metode: { type: DataTypes.TEXT("long"), allowNull: true },
      gambaran_ipteks: { type: DataTypes.TEXT("long"), allowNull: true },
      peta_lokasi_mitra_url: { type: DataTypes.STRING(1024), allowNull: true },
      daftar_pustaka: { type: DataTypes.TEXT("long"), allowNull: true },
      ...timestampsCamel,
    });
  }

  if (!(await tableExists(queryInterface, "jadwal_proposal"))) {
    await queryInterface.createTable("jadwal_proposal", {
      id: uuidPk,
      haki_proposal_id: { type: DataTypes.UUID, allowNull: false },
      nama_kegiatan: { type: DataTypes.STRING(255), allowNull: false },
      tahun: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      urutan: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      ...timestampsCamel,
    });
  }

  if (!(await tableExists(queryInterface, "jadwal_bulanan"))) {
    await queryInterface.createTable("jadwal_bulanan", {
      id: uuidPk,
      jadwal_id: { type: DataTypes.UUID, allowNull: false },
      bulan: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
      ...timestampsCamel,
    });
  }

  if (!(await tableExists(queryInterface, "luaranproposals"))) {
    await queryInterface.createTable("luaranproposals", {
      id: uuidPk,
      haki_proposal_id: { type: DataTypes.UUID, allowNull: false },
      luaran: { type: DataTypes.STRING(255), allowNull: false },
      target_capaian: { type: DataTypes.TEXT, allowNull: true },
      iku_terkait: { type: DataTypes.STRING(255), allowNull: true },
      target_iku: { type: DataTypes.STRING(255), allowNull: true },
      ...timestampsCamel,
    });
  }

  if (!(await tableExists(queryInterface, "rabproposals"))) {
    await queryInterface.createTable("rabproposals", {
      id: uuidPk,
      haki_proposal_id: { type: DataTypes.UUID, allowNull: false },
      tahun_ke: { type: DataTypes.STRING, allowNull: true },
      kelompok: { type: DataTypes.STRING, allowNull: true },
      komponen: { type: DataTypes.STRING, allowNull: true },
      item: { type: DataTypes.STRING, allowNull: true },
      satuan: { type: DataTypes.STRING, allowNull: true },
      biaya_satuan: { type: DataTypes.BIGINT, allowNull: true },
      volume: { type: DataTypes.INTEGER, allowNull: true },
      total_biaya: { type: DataTypes.BIGINT, allowNull: true },
      pajak: { type: DataTypes.STRING, allowNull: true },
      sumber_dana: { type: DataTypes.STRING, allowNull: true },
      ...timestampsCamel,
    });
  }

  if (!(await tableExists(queryInterface, "haki_proposal_outputs"))) {
    await queryInterface.createTable("haki_proposal_outputs", {
      id: uuidPk,
      haki_proposal_id: { type: DataTypes.UUID, allowNull: false },
      output_id: { type: DataTypes.UUID, allowNull: false },
      ...timestampsSnake,
    });
  }

  if (!(await tableExists(queryInterface, "laporan_usulan"))) {
    await queryInterface.createTable("laporan_usulan", {
      id: uuidPk,
      haki_proposal_id: { type: DataTypes.UUID, allowNull: false },
      ketua_user_id: { type: DataTypes.UUID, allowNull: true },
      jenis_laporan: { type: DataTypes.ENUM("laporan_kemajuan", "laporan_akhir"), allowNull: false },
      scope_tipe: { type: DataTypes.ENUM("umum", "hibah_internal"), allowNull: false, defaultValue: "umum" },
      file_url: { type: DataTypes.STRING(500), allowNull: true },
      nama_file: { type: DataTypes.STRING(255), allowNull: true },
      status_laporan: { type: DataTypes.ENUM("Lengkapi Dokumen", "Pending", "Revisi", "Sesuai"), allowNull: false, defaultValue: "Lengkapi Dokumen" },
      last_uploaded_at: { type: DataTypes.DATE, allowNull: true },
      last_replaced_at: { type: DataTypes.DATE, allowNull: true },
      replace_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      catatan_validator: { type: DataTypes.TEXT, allowNull: true },
      validated_by: { type: DataTypes.UUID, allowNull: true },
      validated_at: { type: DataTypes.DATE, allowNull: true },
      ...timestampsSnake,
    });
  }

  await addIndexIfMissing(queryInterface, "haki_proposals", ["user_id"], { name: "idx_hakiproposals_user_id" });
  await addIndexIfMissing(queryInterface, "haki_proposals", ["tipe_usulan"], { name: "idx_hakiproposals_tipe" });
  await addIndexIfMissing(queryInterface, "haki_proposals", ["status_usulan"], { name: "idx_hakiproposals_status" });
  await addIndexIfMissing(queryInterface, "haki_proposals", ["skema_id"], { name: "idx_hakiproposals_skema" });
  await addIndexIfMissing(queryInterface, "haki_proposals", ["prodi_pengusul"], { name: "haki_proposals_prodi_pengusul_index" });
  await addIndexIfMissing(queryInterface, "memberproposals", ["no_identitas"], { name: "idx_memberproposals_no_identitas" });
  await addIndexIfMissing(queryInterface, "memberproposals", ["haki_proposal_id"], { name: "idx_memberproposals_proposal_id" });
  await addIndexIfMissing(queryInterface, "memberproposals", ["haki_proposal_id", "no_identitas"], { name: "uniq_memberproposals_proposal_identitas", unique: true });
  await addIndexIfMissing(queryInterface, "memberproposals", ["prodi_kode_anggota"], { name: "idx_memberproposals_prodi_kode_anggota" });
  await addIndexIfMissing(queryInterface, "mahasiswas", ["prodi_kode"], { name: "mahasiswas_prodi_kode_index" });
  await addIndexIfMissing(queryInterface, "notifications", ["user_id"], { name: "idx_notifications_user_id" });
  await addIndexIfMissing(queryInterface, "notifications", ["status"], { name: "idx_notifications_status" });
  await addIndexIfMissing(queryInterface, "notifications", ["user_id", "status"], { name: "idx_notifications_user_status" });
  await addIndexIfMissing(queryInterface, "jadwal_proposal", ["haki_proposal_id"], { name: "idx_jproposal_haki" });
  await addIndexIfMissing(queryInterface, "jadwal_bulanan", ["jadwal_id", "bulan"], { name: "uq_jadwal_bulan", unique: true });
  await addIndexIfMissing(queryInterface, "jadwal_bulanan", ["jadwal_id"], { name: "idx_jbulanan_jadwal" });
  await addIndexIfMissing(queryInterface, "luaranproposals", ["haki_proposal_id"], { name: "idx_luaran_haki" });
  await addIndexIfMissing(queryInterface, "haki_proposal_outputs", ["haki_proposal_id", "output_id"], { name: "uq_haki_proposal_outputs_proposal_output", unique: true });
  await addIndexIfMissing(queryInterface, "laporan_usulan", ["haki_proposal_id", "jenis_laporan", "scope_tipe"], { name: "uniq_laporan_usulan_scope", unique: true });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  for (const tableName of [
    "laporan_usulan",
    "haki_proposal_outputs",
    "rabproposals",
    "luaranproposals",
    "jadwal_bulanan",
    "jadwal_proposal",
    "tbl_pengabdian_proposals",
    "tbl_penelitian_proposals",
    "notifications",
    "mahasiswas",
    "memberproposals",
    "haki_proposals",
  ]) {
    if (await tableExists(queryInterface, tableName)) {
      await queryInterface.dropTable(tableName);
    }
  }
}
