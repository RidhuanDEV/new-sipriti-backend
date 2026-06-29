import { BIDANG_FOKUS_PERMISSIONS } from "../../../constants/permissions.constants.js";

export const bidangFokusPolicy = {
  viewPermissions: [
    BIDANG_FOKUS_PERMISSIONS.VIEW,
  ],
  createPermission: BIDANG_FOKUS_PERMISSIONS.CREATE,
  editPermission: BIDANG_FOKUS_PERMISSIONS.EDIT,
  deletePermission: BIDANG_FOKUS_PERMISSIONS.DELETE,
  managePermission: BIDANG_FOKUS_PERMISSIONS.MANAGE,
} as const;
