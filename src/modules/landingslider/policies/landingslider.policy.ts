import { PERMISSION_GROUPS } from "../../../constants/permissions.constants.js";

export const landingSliderPolicy = {
  viewPermission: PERMISSION_GROUPS.LANDING_SLIDER.VIEW,
  createPermission: PERMISSION_GROUPS.LANDING_SLIDER.CREATE,
  editPermission: PERMISSION_GROUPS.LANDING_SLIDER.EDIT,
  deletePermission: PERMISSION_GROUPS.LANDING_SLIDER.DELETE,
  managePermission: PERMISSION_GROUPS.LANDING_SLIDER.MANAGE,
} as const;
