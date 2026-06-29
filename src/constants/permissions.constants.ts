export const PERMISSION_GROUPS = {
  USER: {
    VIEW: "view_users",
    CREATE: "create_user",
    EDIT: "edit_user",
    DELETE: "delete_user",
    ASSIGN_ROLES: "assign_roles",
    MANAGE: "manage_users",
  },
  ROLE: {
    VIEW: "view_roles",
    CREATE: "create_role",
    EDIT: "edit_role",
    DELETE: "delete_role",
    MANAGE: "manage_roles",
  },
  PERMISSION: {
    VIEW: "view_permissions",
    ASSIGN: "assign_permissions",
    MANAGE: "manage_permissions",
  },
  PRODUCT: {
    MANAGE: "manage_product",
    CREATE: "create_product",
    UPDATE: "update_product",
    DELETE: "delete_product",
    VIEW: "view_product",
  },
  PRODI: {
    VIEW: "view_prodi",
    CREATE: "create_prodi",
    EDIT: "edit_prodi",
    DELETE: "delete_prodi",
    MANAGE: "manage_prodi",
  },
  SKEMA: {
    VIEW: "view_skema",
    CREATE: "create_skema",
    EDIT: "edit_skema",
    DELETE: "delete_skema",
    MANAGE: "manage_skema",
  },
  BIDANG_FOKUS: {
    VIEW: "view_bidang_fokus",
    CREATE: "create_bidang_fokus",
    EDIT: "edit_bidang_fokus",
    DELETE: "delete_bidang_fokus",
    MANAGE: "manage_bidang_fokus",
  },
  TAHUN_AKADEMIK: {
    VIEW: "view_tahun_akademik",
    CREATE: "create_tahun_akademik",
    EDIT: "edit_tahun_akademik",
    DELETE: "delete_tahun_akademik",
    MANAGE: "manage_tahun_akademik",
  },
  OUTPUT: {
    VIEW: "view_output",
    CREATE: "create_output",
    EDIT: "edit_output",
    DELETE: "delete_output",
    MANAGE: "manage_output",
  },
  SERTIFIKAT_MUTU: {
    MANAGE: "manage_sertifikat_mutu",
  },
  BERITA: {
    VIEW: "view_berita",
    CREATE: "create_berita",
    EDIT: "edit_berita",
    DELETE: "delete_berita",
    MANAGE: "manage_berita",
  },
  PENGUMUMAN: {
    VIEW: "view_pengumuman",
    CREATE: "create_pengumuman",
    EDIT: "edit_pengumuman",
    DELETE: "delete_pengumuman",
    MANAGE: "manage_pengumuman",
  },
  PANDUAN: {
    VIEW: "view_panduan",
    CREATE: "create_panduan",
    EDIT: "edit_panduan",
    DELETE: "delete_panduan",
    MANAGE: "manage_panduan",
  },
  CAROUSEL: {
    VIEW: "view_carousel",
    CREATE: "create_carousel",
    EDIT: "edit_carousel",
    DELETE: "delete_carousel",
    MANAGE: "manage_carousel",
  },
  LANDING_SLIDER: {
    VIEW: "view_landing_slider",
    CREATE: "create_landing_slider",
    EDIT: "edit_landing_slider",
    DELETE: "delete_landing_slider",
    MANAGE: "manage_landing_slider",
  },
  CAPAIAN: {
    VIEW: "view_capaian",
    CREATE: "create_capaian",
    EDIT: "edit_capaian",
    DELETE: "delete_capaian",
    MANAGE: "manage_capaian",
  },
  KATEGORI_PUBLIKASI: {
    MANAGE: "manage_kategori_publikasi",
  },
  PUBLIKASI: {
    VIEW: "view_publikasi",
    CREATE: "create_publikasi",
    EDIT: "edit_publikasi",
    DELETE: "delete_publikasi",
    MANAGE: "manage_publikasi",
  },
  MITRA_KERJA_RISET: {
    MANAGE: "manage_mitra_kerja_riset",
  },
  PRODUCT_RISET: {
    MANAGE: "manage_product_riset",
  },
  PENGHARGAAN_RISET: {
    MANAGE: "manage_penghargaan_riset",
  },
  HIBAH_INTERNAL: {
    VIEW: "view_hibah_internal",
    CREATE: "create_hibah_internal",
    EDIT: "edit_hibah_internal",
    DELETE: "delete_hibah_internal",
    MANAGE: "manage_hibah_internal",
  },
  PROPOSAL: {
    VIEW: "view_proposal",
    CREATE: "create_proposal",
    EDIT: "edit_proposal",
    DELETE: "delete_proposal",
    REVIEW: "review_proposal",
    APPROVE: "approve_proposal",
    MANAGE: "manage_proposal",
    SUBMIT: "submit_proposal",
    EDIT_BY_PRODI: "edit_usulan_by_prodi",
  },
  PENELITIAN: {
    VIEW: "view_penelitian",
    MANAGE: "manage_penelitian",
    FORWARD: "forward_usulan_penelitian",
  },
  PENGABDIAN: {
    VIEW: "view_pengabdian",
    MANAGE: "manage_pengabdian",
    FORWARD: "forward_usulan_pengabdian",
  },
  HKI: {
    VIEW: "view_hki",
    CREATE: "create_hki",
    EDIT: "edit_hki",
    DELETE: "delete_hki",
    SUBMIT: "submit_hki",
    MANAGE: "manage_hki",
    APPROVE: "approve_hki",
  },
  MONEV: {
    VIEW: "view_monev",
    CREATE: "create_monev",
    EDIT: "edit_monev",
    DELETE: "delete_monev",
    MANAGE: "manage_monev",
  },
  DASHBOARD: {
    VIEW: "view_dashboard",
    VIEW_ADMIN: "view_admin_dashboard",
  },
  SIGNATURE: {
    VIEW: "view_signature",
    CREATE: "create_signature",
    EDIT: "edit_signature",
    DELETE: "delete_signature",
    MANAGE: "manage_signature",
  },
  AUDIT_LOG: {
    VIEW: "view_audit_log",
  },
  LAPORAN_KEMAJUAN: {
    VIEW: "view_laporan_kemajuan",
    CREATE: "create_laporan_kemajuan",
    EDIT: "edit_laporan_kemajuan",
    DELETE: "delete_laporan_kemajuan",
  },
  LAPORAN_AKHIR: {
    VIEW: "view_laporan_akhir",
    CREATE: "create_laporan_akhir",
    EDIT: "edit_laporan_akhir",
    DELETE: "delete_laporan_akhir",
  },
  AKUN_PENGGUNA: {
    VIEW: "view_akun_pengguna",
    CREATE: "create_akun_pengguna",
    EDIT: "edit_akun_pengguna",
    DELETE: "delete_akun_pengguna",
    MANAGE: "manage_akun_pengguna",
    VIEW_DETAIL: "view_detail_akun_peserta",
  },
  UI_GATE: {
    VIEW_PERBAIKAN_USULAN: "view_perbaikan_usulan",
    SUBMIT_PERBAIKAN_USULAN: "submit_perbaikan_usulan",
    VIEW_PERBAIKAN_USULAN_ADMIN: "view_perbaikan_usulan_admin",
    VIEW_MONITORING_EVALUASI: "view_monitoring_evaluasi",
    VIEW_USER_PROFILE: "view_user_profile",
    EDIT_USER_PROFILE: "edit_user_profile",
    VIEW_REVIEW_PROPOSAL: "view_review_proposal",
    VIEW_REVIEW_HKI: "view_review_hki",
    MANAGE_SETTINGS_ADMIN: "manage_settings_admin",
    VIEW_ADMIN_DASHBOARD_ANALYTICS: "view_admin_dashboard_analytics",
    VIEW_DAFTAR_USULAN_ADMIN: "view_daftar_usulan_admin",
    VIEW_USULAN_BY_PRODI: "view_usulan_by_prodi",
    MANAGE_HAK_AKSES: "manage_hak_akses",
    VIEW_HAK_AKSES: "view_hak_akses",
  },
  HKI_ALIAS: {
    REVIEW: "review_hki",
    APPROVE_REJECT: "approve_reject_hki",
    VIEW_KI: "view_kekayaan_intelektual",
    CREATE_KI: "create_kekayaan_intelektual",
    EDIT_KI: "edit_kekayaan_intelektual",
    DELETE_KI: "delete_kekayaan_intelektual",
  },
} as const;

type PermissionGroups = typeof PERMISSION_GROUPS;

export type PermissionName = {
  [K in keyof PermissionGroups]:
    PermissionGroups[K][keyof PermissionGroups[K]];
}[keyof PermissionGroups];

export const USER_PERMISSIONS = PERMISSION_GROUPS.USER;
export const ROLE_PERMISSIONS = PERMISSION_GROUPS.ROLE;
export const PERMISSION_PERMISSIONS = PERMISSION_GROUPS.PERMISSION;
export const PRODUCT_PERMISSIONS = PERMISSION_GROUPS.PRODUCT;
export const PRODI_PERMISSIONS = PERMISSION_GROUPS.PRODI;
export const SKEMA_PERMISSIONS = PERMISSION_GROUPS.SKEMA;
export const BIDANG_FOKUS_PERMISSIONS = PERMISSION_GROUPS.BIDANG_FOKUS;
export const TAHUN_AKADEMIK_PERMISSIONS = PERMISSION_GROUPS.TAHUN_AKADEMIK;
export const OUTPUT_PERMISSIONS = PERMISSION_GROUPS.OUTPUT;
export const SERTIFIKAT_MUTU_PERMISSIONS = PERMISSION_GROUPS.SERTIFIKAT_MUTU;
export const BERITA_PERMISSIONS = PERMISSION_GROUPS.BERITA;
export const PENGUMUMAN_PERMISSIONS = PERMISSION_GROUPS.PENGUMUMAN;
export const PANDUAN_PERMISSIONS = PERMISSION_GROUPS.PANDUAN;
export const CAROUSEL_PERMISSIONS = PERMISSION_GROUPS.CAROUSEL;
export const LANDING_SLIDER_PERMISSIONS = PERMISSION_GROUPS.LANDING_SLIDER;
export const CAPAIAN_PERMISSIONS = PERMISSION_GROUPS.CAPAIAN;
export const KATEGORI_PUBLIKASI_PERMISSIONS = PERMISSION_GROUPS.KATEGORI_PUBLIKASI;
export const PUBLIKASI_PERMISSIONS = PERMISSION_GROUPS.PUBLIKASI;
export const MITRA_KERJA_RISET_PERMISSIONS = PERMISSION_GROUPS.MITRA_KERJA_RISET;
export const PRODUCT_RISET_PERMISSIONS = PERMISSION_GROUPS.PRODUCT_RISET;
export const PENGHARGAAN_RISET_PERMISSIONS = PERMISSION_GROUPS.PENGHARGAAN_RISET;
export const HIBAH_INTERNAL_PERMISSIONS = PERMISSION_GROUPS.HIBAH_INTERNAL;
export const PROPOSAL_PERMISSIONS = PERMISSION_GROUPS.PROPOSAL;
export const PENELITIAN_PERMISSIONS = PERMISSION_GROUPS.PENELITIAN;
export const PENGABDIAN_PERMISSIONS = PERMISSION_GROUPS.PENGABDIAN;
export const HKI_PERMISSIONS = PERMISSION_GROUPS.HKI;
export const MONEV_PERMISSIONS = PERMISSION_GROUPS.MONEV;
export const DASHBOARD_PERMISSIONS = PERMISSION_GROUPS.DASHBOARD;
export const SIGNATURE_PERMISSIONS = PERMISSION_GROUPS.SIGNATURE;
export const AUDIT_LOG_PERMISSIONS = PERMISSION_GROUPS.AUDIT_LOG;
export const LAPORAN_KEMAJUAN_PERMISSIONS = PERMISSION_GROUPS.LAPORAN_KEMAJUAN;
export const LAPORAN_AKHIR_PERMISSIONS = PERMISSION_GROUPS.LAPORAN_AKHIR;
export const AKUN_PENGGUNA_PERMISSIONS = PERMISSION_GROUPS.AKUN_PENGGUNA;
export const UI_GATE_PERMISSIONS = PERMISSION_GROUPS.UI_GATE;
export const HKI_ALIAS_PERMISSIONS = PERMISSION_GROUPS.HKI_ALIAS;
