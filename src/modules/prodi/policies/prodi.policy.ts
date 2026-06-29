import { PRODI_PERMISSIONS } from "../../../constants/permissions.constants.js";

export const prodiPolicy = {
  viewPermissions: [PRODI_PERMISSIONS.VIEW],
  createPermission: PRODI_PERMISSIONS.CREATE,
  editPermission: PRODI_PERMISSIONS.EDIT,
  deletePermission: PRODI_PERMISSIONS.DELETE,
  managePermission: PRODI_PERMISSIONS.MANAGE,
} as const;
