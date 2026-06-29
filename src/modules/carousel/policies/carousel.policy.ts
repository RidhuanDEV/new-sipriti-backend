import { PERMISSION_GROUPS } from "../../../constants/permissions.constants.js";

export const carouselPolicy = {
  viewPermission: PERMISSION_GROUPS.CAROUSEL.VIEW,
  createPermission: PERMISSION_GROUPS.CAROUSEL.CREATE,
  editPermission: PERMISSION_GROUPS.CAROUSEL.EDIT,
  deletePermission: PERMISSION_GROUPS.CAROUSEL.DELETE,
  managePermission: PERMISSION_GROUPS.CAROUSEL.MANAGE,
} as const;
