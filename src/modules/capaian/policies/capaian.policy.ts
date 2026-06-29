import { PERMISSION_GROUPS } from "../../../constants/permissions.constants.js";

export const capaianPolicy = {
  viewPermission: PERMISSION_GROUPS.CAPAIAN.VIEW,
  editPermission: PERMISSION_GROUPS.CAPAIAN.EDIT,
  managePermission: PERMISSION_GROUPS.CAPAIAN.MANAGE,
} as const;
