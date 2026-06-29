import { SKEMA_PERMISSIONS } from "../../../constants/permissions.constants.js";

export const skemaPolicy = {
  viewPermissions: [SKEMA_PERMISSIONS.VIEW],
  createPermission: SKEMA_PERMISSIONS.CREATE,
  editPermission: SKEMA_PERMISSIONS.EDIT,
  deletePermission: SKEMA_PERMISSIONS.DELETE,
  managePermission: SKEMA_PERMISSIONS.MANAGE,
} as const;
