import { TAHUN_AKADEMIK_PERMISSIONS } from "../../../constants/permissions.constants.js";

export const tahunAkademikPolicy = {
  createPermission: TAHUN_AKADEMIK_PERMISSIONS.CREATE,
  editPermission: TAHUN_AKADEMIK_PERMISSIONS.EDIT,
  deletePermission: TAHUN_AKADEMIK_PERMISSIONS.DELETE,
  managePermission: TAHUN_AKADEMIK_PERMISSIONS.MANAGE,
} as const;
