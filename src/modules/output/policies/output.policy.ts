import { OUTPUT_PERMISSIONS } from "../../../constants/permissions.constants.js";

export const outputPolicy = {
  createPermission: OUTPUT_PERMISSIONS.CREATE,
  editPermission: OUTPUT_PERMISSIONS.EDIT,
  deletePermission: OUTPUT_PERMISSIONS.DELETE,
  managePermission: OUTPUT_PERMISSIONS.MANAGE,
} as const;
