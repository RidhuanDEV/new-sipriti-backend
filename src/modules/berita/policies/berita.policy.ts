import { PERMISSION_GROUPS } from "../../../constants/permissions.constants.js";

export const beritaPolicy = {
  createPermissions: [PERMISSION_GROUPS.BERITA.CREATE, PERMISSION_GROUPS.BERITA.MANAGE],
  editPermissions: [PERMISSION_GROUPS.BERITA.EDIT, PERMISSION_GROUPS.BERITA.MANAGE],
  deletePermissions: [PERMISSION_GROUPS.BERITA.DELETE, PERMISSION_GROUPS.BERITA.MANAGE],
} as const;
