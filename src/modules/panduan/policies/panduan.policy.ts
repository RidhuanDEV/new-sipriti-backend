import { PERMISSION_GROUPS } from "../../../constants/permissions.constants.js";

export const panduanPolicy = {
  createPermissions: [PERMISSION_GROUPS.PANDUAN.CREATE, PERMISSION_GROUPS.PANDUAN.MANAGE],
  editPermissions: [PERMISSION_GROUPS.PANDUAN.EDIT, PERMISSION_GROUPS.PANDUAN.MANAGE],
  deletePermissions: [PERMISSION_GROUPS.PANDUAN.DELETE, PERMISSION_GROUPS.PANDUAN.MANAGE],
} as const;
