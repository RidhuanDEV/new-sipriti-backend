import { PERMISSION_GROUPS } from "../../../constants/permissions.constants.js";

export const hibahInternalPolicy = {
  viewPermissions: [PERMISSION_GROUPS.HIBAH_INTERNAL.VIEW, PERMISSION_GROUPS.HIBAH_INTERNAL.MANAGE] as const,
  createPermission: PERMISSION_GROUPS.HIBAH_INTERNAL.CREATE,
  editPermission: PERMISSION_GROUPS.HIBAH_INTERNAL.EDIT,
  deletePermission: PERMISSION_GROUPS.HIBAH_INTERNAL.DELETE,
  managePermission: PERMISSION_GROUPS.HIBAH_INTERNAL.MANAGE,
} as const;
