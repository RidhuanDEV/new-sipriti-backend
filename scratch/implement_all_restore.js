import fs from 'node:fs';
import path from 'node:path';

function editFile(filePath, replacements) {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  let content = fs.readFileSync(absolutePath, 'utf8');
  for (const [index, { target, replacement }] of replacements.entries()) {
    if (!content.includes(target)) {
      console.error(`Target not found in ${filePath} at replacement index ${index}`);
      console.error("Expected:\n" + target);
      process.exit(1);
    }
    content = content.replace(target, replacement);
  }
  fs.writeFileSync(absolutePath, content, 'utf8');
  console.log(`Updated: ${filePath}`);
}

console.log("Starting Phase 3.5 implementation...");

// ==========================================
// 1–5. Modules 1-5 already completed
// ==========================================

// ==========================================
// 6. Berita Module
// ==========================================
editFile('new_sipriti_backend/src/modules/berita/berita.service.ts', [
  {
    target: `  async deleteBerita(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<void> {
    const berita = await repository.findById(id);
    if (!berita) throw HttpError.notFound("Berita tidak ditemukan");
    const before = toBeritaResponse(berita);

    await sequelize.transaction((trx) => repository.delete(berita, trx));
    if (before.photo_url) await deleteFileSafe(fromPublicUploadUrl(before.photo_url)?.absolutePath ?? null);
    if (before.file_url) await deleteFileSafe(fromPublicUploadUrl(before.file_url)?.absolutePath ?? null);

    auditService.persistNonBlocking({
      action: AuditAction.DELETE,
      module: BERITA_MODULE,
      entityId: before.id,
      userId: user.id,
      before,
      requestId,
    });
  }`,
    replacement: `  async deleteBerita(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<void> {
    const berita = await repository.findById(id);
    if (!berita) throw HttpError.notFound("Berita tidak ditemukan");
    const before = toBeritaResponse(berita);

    await sequelize.transaction((trx) => repository.delete(berita, trx));
    if (before.photo_url) await deleteFileSafe(fromPublicUploadUrl(before.photo_url)?.absolutePath ?? null);
    if (before.file_url) await deleteFileSafe(fromPublicUploadUrl(before.file_url)?.absolutePath ?? null);

    auditService.persistNonBlocking({
      action: AuditAction.DELETE,
      module: BERITA_MODULE,
      entityId: before.id,
      userId: user.id,
      before,
      requestId,
    });
  }

  async restoreBerita(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<BeritaResponseDto> {
    const berita = await repository.findByIdWithDeleted(id);
    if (!berita) throw HttpError.notFound("Berita tidak ditemukan");
    if (!berita.deletedAt) {
      throw HttpError.badRequest("Berita tidak dalam status terhapus");
    }
    await sequelize.transaction((trx) => repository.restore(berita, trx));

    const after = toBeritaResponse(berita);
    auditService.persistNonBlocking({
      action: AuditAction.RESTORE,
      module: BERITA_MODULE,
      entityId: berita.id,
      userId: user.id,
      after,
      requestId,
    });
    return after;
  }`
  }
]);

editFile('new_sipriti_backend/src/modules/berita/berita.controller.ts', [
  {
    target: `  deleteBerita = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await service.deleteBerita(req.params.id, requireAuthenticatedUser(req), requestId(req));
      sendSuccess(res, { message: "Berita berhasil dihapus" });
    } catch (err) {
      next(err);
    }
  };
}`,
    replacement: `  deleteBerita = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await service.deleteBerita(req.params.id, requireAuthenticatedUser(req), requestId(req));
      sendSuccess(res, { message: "Berita berhasil dihapus" });
    } catch (err) {
      next(err);
    }
  };

  restoreBerita = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await service.restoreBerita(
        req.params.id,
        requireAuthenticatedUser(req),
        requestId(req),
      );
      sendSuccess(res, {
        message: "Berita berhasil dipulihkan",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };`
  }
]);

editFile('new_sipriti_backend/src/modules/berita/berita.routes.ts', [
  {
    target: `router.delete(
  "/:id",
  authenticate,
  requireAnyPermission(beritaPolicy.deletePermissions),
  validate({ params: beritaIdParamSchema }),
  controller.deleteBerita,
);`,
    replacement: `router.delete(
  "/:id",
  authenticate,
  requireAnyPermission(beritaPolicy.deletePermissions),
  validate({ params: beritaIdParamSchema }),
  controller.deleteBerita,
);
router.post(
  "/:id/restore",
  authenticate,
  requireAnyPermission(beritaPolicy.deletePermissions),
  validate({ params: beritaIdParamSchema }),
  controller.restoreBerita,
);`
  }
]);

// ==========================================
// 7. Pengumuman Module
// ==========================================
editFile('new_sipriti_backend/src/modules/pengumuman/pengumuman.repository.ts', [
  {
    target: `  async delete(pengumuman: Pengumuman, transaction?: Transaction): Promise<void> {
    await pengumuman.destroy(transaction ? { transaction } : {});
  }
}`,
    replacement: `  async delete(pengumuman: Pengumuman, transaction?: Transaction): Promise<void> {
    await pengumuman.destroy(transaction ? { transaction } : {});
  }

  findByIdWithDeleted(id: string): Promise<Pengumuman | null> {
    return Pengumuman.findOne({ where: { id }, paranoid: false });
  }

  async restore(pengumuman: Pengumuman, transaction?: Transaction): Promise<void> {
    await pengumuman.restore(transaction ? { transaction } : {});
  }
}`
  }
]);

editFile('new_sipriti_backend/src/modules/pengumuman/pengumuman.service.ts', [
  {
    target: `  async deletePengumuman(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<void> {
    const pengumuman = await repository.findById(id);
    if (!pengumuman) throw HttpError.notFound("Pengumuman tidak ditemukan");
    const before = toPengumumanResponse(pengumuman);
    await sequelize.transaction((trx) => repository.delete(pengumuman, trx));

    if (before.gambar) await deleteFileSafe(fromPublicUploadUrl(before.gambar)?.absolutePath ?? null);
    if (before.file_lampiran) await deleteFileSafe(fromPublicUploadUrl(before.file_lampiran)?.absolutePath ?? null);
    auditService.persistNonBlocking({
      action: AuditAction.DELETE,
      module: PENGUMUMAN_MODULE,
      entityId: before.id,
      userId: user.id,
      before,
      requestId,
    });
  }`,
    replacement: `  async deletePengumuman(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<void> {
    const pengumuman = await repository.findById(id);
    if (!pengumuman) throw HttpError.notFound("Pengumuman tidak ditemukan");
    const before = toPengumumanResponse(pengumuman);
    await sequelize.transaction((trx) => repository.delete(pengumuman, trx));

    if (before.gambar) await deleteFileSafe(fromPublicUploadUrl(before.gambar)?.absolutePath ?? null);
    if (before.file_lampiran) await deleteFileSafe(fromPublicUploadUrl(before.file_lampiran)?.absolutePath ?? null);
    auditService.persistNonBlocking({
      action: AuditAction.DELETE,
      module: PENGUMUMAN_MODULE,
      entityId: before.id,
      userId: user.id,
      before,
      requestId,
    });
  }

  async restorePengumuman(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<PengumumanResponseDto> {
    const pengumuman = await repository.findByIdWithDeleted(id);
    if (!pengumuman) throw HttpError.notFound("Pengumuman tidak ditemukan");
    if (!pengumuman.deletedAt) {
      throw HttpError.badRequest("Pengumuman tidak dalam status terhapus");
    }
    await sequelize.transaction((trx) => repository.restore(pengumuman, trx));

    const after = toPengumumanResponse(pengumuman);
    auditService.persistNonBlocking({
      action: AuditAction.RESTORE,
      module: PENGUMUMAN_MODULE,
      entityId: pengumuman.id,
      userId: user.id,
      after,
      requestId,
    });
    return after;
  }`
  }
]);

editFile('new_sipriti_backend/src/modules/pengumuman/pengumuman.controller.ts', [
  {
    target: `  deletePengumuman = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await service.deletePengumuman(req.params.id, requireAuthenticatedUser(req), requestId(req));
      sendSuccess(res, { message: "Pengumuman berhasil dihapus" });
    } catch (err) {
      next(err);
    }
  };
}`,
    replacement: `  deletePengumuman = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await service.deletePengumuman(req.params.id, requireAuthenticatedUser(req), requestId(req));
      sendSuccess(res, { message: "Pengumuman berhasil dihapus" });
    } catch (err) {
      next(err);
    }
  };

  restorePengumuman = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await service.restorePengumuman(
        req.params.id,
        requireAuthenticatedUser(req),
        requestId(req),
      );
      sendSuccess(res, {
        message: "Pengumuman berhasil dipulihkan",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };`
  }
]);

editFile('new_sipriti_backend/src/modules/pengumuman/pengumuman.routes.ts', [
  {
    target: `router.delete(
  "/:id",
  authenticate,
  requireAnyPermission(pengumumanPolicy.deletePermissions),
  validate({ params: pengumumanIdParamSchema }),
  controller.deletePengumuman,
);`,
    replacement: `router.delete(
  "/:id",
  authenticate,
  requireAnyPermission(pengumumanPolicy.deletePermissions),
  validate({ params: pengumumanIdParamSchema }),
  controller.deletePengumuman,
);
router.post(
  "/:id/restore",
  authenticate,
  requireAnyPermission(pengumumanPolicy.deletePermissions),
  validate({ params: pengumumanIdParamSchema }),
  controller.restorePengumuman,
);`
  }
]);

// ==========================================
// 8. Panduan Module
// ==========================================
editFile('new_sipriti_backend/src/modules/panduan/panduan.repository.ts', [
  {
    target: `  async delete(panduan: Panduan, transaction?: Transaction): Promise<void> {
    await panduan.destroy(transaction ? { transaction } : {});
  }
}`,
    replacement: `  async delete(panduan: Panduan, transaction?: Transaction): Promise<void> {
    await panduan.destroy(transaction ? { transaction } : {});
  }

  findByIdWithDeleted(id: string): Promise<Panduan | null> {
    return Panduan.findOne({ where: { id }, paranoid: false });
  }

  async restore(panduan: Panduan, transaction?: Transaction): Promise<void> {
    await panduan.restore(transaction ? { transaction } : {});
  }
}`
  }
]);

editFile('new_sipriti_backend/src/modules/panduan/panduan.service.ts', [
  {
    target: `  async deletePanduan(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<void> {
    const panduan = await repository.findById(id);
    if (!panduan) throw HttpError.notFound("Panduan tidak ditemukan");
    const before = toPanduanResponse(panduan);
    await sequelize.transaction((trx) => repository.delete(panduan, trx));

    if (before.thumbnail) await deleteFileSafe(fromPublicUploadUrl(before.thumbnail)?.absolutePath ?? null);
    if (before.file_url) await deleteFileSafe(fromPublicUploadUrl(before.file_url)?.absolutePath ?? null);
    auditService.persistNonBlocking({
      action: AuditAction.DELETE,
      module: PANDUAN_MODULE,
      entityId: before.id,
      userId: user.id,
      before,
      requestId,
    });
  }`,
    replacement: `  async deletePanduan(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<void> {
    const panduan = await repository.findById(id);
    if (!panduan) throw HttpError.notFound("Panduan tidak ditemukan");
    const before = toPanduanResponse(panduan);
    await sequelize.transaction((trx) => repository.delete(panduan, trx));

    if (before.thumbnail) await deleteFileSafe(fromPublicUploadUrl(before.thumbnail)?.absolutePath ?? null);
    if (before.file_url) await deleteFileSafe(fromPublicUploadUrl(before.file_url)?.absolutePath ?? null);
    auditService.persistNonBlocking({
      action: AuditAction.DELETE,
      module: PANDUAN_MODULE,
      entityId: before.id,
      userId: user.id,
      before,
      requestId,
    });
  }

  async restorePanduan(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<PanduanResponseDto> {
    const panduan = await repository.findByIdWithDeleted(id);
    if (!panduan) throw HttpError.notFound("Panduan tidak ditemukan");
    if (!panduan.deletedAt) {
      throw HttpError.badRequest("Panduan tidak dalam status terhapus");
    }
    await sequelize.transaction((trx) => repository.restore(panduan, trx));

    const after = toPanduanResponse(panduan);
    auditService.persistNonBlocking({
      action: AuditAction.RESTORE,
      module: PANDUAN_MODULE,
      entityId: panduan.id,
      userId: user.id,
      after,
      requestId,
    });
    return after;
  }`
  }
]);

editFile('new_sipriti_backend/src/modules/panduan/panduan.controller.ts', [
  {
    target: `  deletePanduan = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await service.deletePanduan(req.params.id, requireAuthenticatedUser(req), requestId(req));
      sendSuccess(res, { message: "Panduan berhasil dihapus" });
    } catch (err) {
      next(err);
    }
  };
}`,
    replacement: `  deletePanduan = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await service.deletePanduan(req.params.id, requireAuthenticatedUser(req), requestId(req));
      sendSuccess(res, { message: "Panduan berhasil dihapus" });
    } catch (err) {
      next(err);
    }
  };

  restorePanduan = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await service.restorePanduan(
        req.params.id,
        requireAuthenticatedUser(req),
        requestId(req),
      );
      sendSuccess(res, {
        message: "Panduan berhasil dipulihkan",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };`
  }
]);

editFile('new_sipriti_backend/src/modules/panduan/panduan.routes.ts', [
  {
    target: `router.delete(
  "/:id",
  authenticate,
  requireAnyPermission(panduanPolicy.deletePermissions),
  validate({ params: panduanIdParamSchema }),
  controller.deletePanduan,
);`,
    replacement: `router.delete(
  "/:id",
  authenticate,
  requireAnyPermission(panduanPolicy.deletePermissions),
  validate({ params: panduanIdParamSchema }),
  controller.deletePanduan,
);
router.post(
  "/:id/restore",
  authenticate,
  requireAnyPermission(panduanPolicy.deletePermissions),
  validate({ params: panduanIdParamSchema }),
  controller.restorePanduan,
);`
  }
]);

// ==========================================
// 9. Landing Slider Module
// ==========================================
editFile('new_sipriti_backend/src/modules/landingslider/landingslider.repository.ts', [
  {
    target: `  async delete(slider: LandingSlider, transaction?: Transaction): Promise<void> {
    await slider.destroy(transaction ? { transaction } : {});
  }
}`,
    replacement: `  async delete(slider: LandingSlider, transaction?: Transaction): Promise<void> {
    await slider.destroy(transaction ? { transaction } : {});
  }

  findByIdWithDeleted(id: string): Promise<LandingSlider | null> {
    return LandingSlider.findOne({ where: { id }, paranoid: false });
  }

  async restore(slider: LandingSlider, transaction?: Transaction): Promise<void> {
    await slider.restore(transaction ? { transaction } : {});
  }
}`
  }
]);

editFile('new_sipriti_backend/src/modules/landingslider/landingslider.service.ts', [
  {
    target: `  async deleteLandingSlider(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<void> {
    const slider = await repository.findById(id);
    if (!slider) throw HttpError.notFound("Slider tidak ditemukan");

    const before = toLandingSliderResponse(slider);
    await sequelize.transaction((trx) => repository.delete(slider, trx));
    await deleteFileSafe(fromPublicUploadUrl(before.img_desktop)?.absolutePath ?? null);
    await deleteFileSafe(fromPublicUploadUrl(before.img_mobile)?.absolutePath ?? null);
    auditService.persistNonBlocking({
      action: AuditAction.DELETE,
      module: LANDING_SLIDER_MODULE,
      entityId: before.id,
      userId: user.id,
      before,
      requestId,
    });
  }`,
    replacement: `  async deleteLandingSlider(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<void> {
    const slider = await repository.findById(id);
    if (!slider) throw HttpError.notFound("Slider tidak ditemukan");

    const before = toLandingSliderResponse(slider);
    await sequelize.transaction((trx) => repository.delete(slider, trx));
    await deleteFileSafe(fromPublicUploadUrl(before.img_desktop)?.absolutePath ?? null);
    await deleteFileSafe(fromPublicUploadUrl(before.img_mobile)?.absolutePath ?? null);
    auditService.persistNonBlocking({
      action: AuditAction.DELETE,
      module: LANDING_SLIDER_MODULE,
      entityId: before.id,
      userId: user.id,
      before,
      requestId,
    });
  }

  async restoreLandingSlider(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<LandingSliderResponseDto> {
    const slider = await repository.findByIdWithDeleted(id);
    if (!slider) throw HttpError.notFound("Slider tidak ditemukan");
    if (!slider.deletedAt) {
      throw HttpError.badRequest("Slider tidak dalam status terhapus");
    }
    await sequelize.transaction((trx) => repository.restore(slider, trx));

    const after = toLandingSliderResponse(slider);
    auditService.persistNonBlocking({
      action: AuditAction.RESTORE,
      module: LANDING_SLIDER_MODULE,
      entityId: slider.id,
      userId: user.id,
      after,
      requestId,
    });
    return after;
  }`
  }
]);

editFile('new_sipriti_backend/src/modules/landingslider/landingslider.controller.ts', [
  {
    target: `  deleteLandingSlider = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      await service.deleteLandingSlider(req.params.id, requireAuthenticatedUser(req), getRequestId(req));
      sendSuccess(res, { message: "Berhasil menghapus slider" });
    } catch (err) {
      next(err);
    }
  };
}`,
    replacement: `  deleteLandingSlider = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      await service.deleteLandingSlider(req.params.id, requireAuthenticatedUser(req), getRequestId(req));
      sendSuccess(res, { message: "Berhasil menghapus slider" });
    } catch (err) {
      next(err);
    }
  };

  restoreLandingSlider = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.restoreLandingSlider(req.params.id, requireAuthenticatedUser(req), getRequestId(req));
      sendSuccess(res, { message: "Berhasil memulihkan slider", data: result });
    } catch (err) {
      next(err);
    }
  };`
  }
]);

editFile('new_sipriti_backend/src/modules/landingslider/landingslider.routes.ts', [
  {
    target: `router.delete("/:id", authenticate, requirePermission(landingSliderPolicy.deletePermission), validate({ params: landingSliderIdParamSchema }), controller.deleteLandingSlider);`,
    replacement: `router.delete("/:id", authenticate, requirePermission(landingSliderPolicy.deletePermission), validate({ params: landingSliderIdParamSchema }), controller.deleteLandingSlider);
router.post("/:id/restore", authenticate, requirePermission(landingSliderPolicy.deletePermission), validate({ params: landingSliderIdParamSchema }), controller.restoreLandingSlider);`
  }
]);

// ==========================================
// 10. HKI Module
// ==========================================
editFile('new_sipriti_backend/src/modules/hki/hki.service.ts', [
  {
    target: `  requestIdFromHeaders = requestIdFromHeaders;
}`,
    replacement: `  async restoreHKI(
    id: string,
    user: AuthenticatedUserContext,
    requestId: string | undefined,
  ): Promise<HKI> {
    const record = await HKI.findOne({ where: { id }, paranoid: false });
    if (!record) throw HttpError.notFound("Data HKI tidak ditemukan");
    if (!record.deletedAt) {
      throw HttpError.badRequest("Data HKI tidak dalam status terhapus");
    }
    await sequelize.transaction((transaction) => record.restore({ transaction }));

    auditService.persistNonBlocking({
      action: AuditAction.RESTORE,
      module: HKI_MODULE,
      entityId: record.id,
      userId: user.id,
      after: { judul: record.judul, inventor: record.inventor },
      requestId,
    });
    return record;
  }

  requestIdFromHeaders = requestIdFromHeaders;
}`
  }
]);

editFile('new_sipriti_backend/src/modules/hki/hki.controller.ts', [
  {
    target: `  getAllHKI = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await hkiService.getAllHKI(hkiReviewQuerySchema.parse(req.query));
      sendSuccess(res, { message: "Berhasil mengambil semua data HKI", data });
    } catch (err) {
      next(err);
    }
  };
}`,
    replacement: `  getAllHKI = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await hkiService.getAllHKI(hkiReviewQuerySchema.parse(req.query));
      sendSuccess(res, { message: "Berhasil mengambil semua data HKI", data });
    } catch (err) {
      next(err);
    }
  };

  restoreHKI = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = hkiIdParamSchema.parse(req.params);
      const data = await hkiService.restoreHKI(params.id, requireAuthenticatedUser(req), requestId(req));
      sendSuccess(res, { message: "HKI berhasil dipulihkan", data });
    } catch (err) {
      next(err);
    }
  };`
  }
]);

editFile('new_sipriti_backend/src/modules/hki/hki.routes.ts', [
  {
    target: `router.delete(
  "/:id",
  authenticate,
  requireAnyPermission(["delete_hki", "manage_hki"]),
  validate({ params: hkiIdParamSchema }),
  controller.deleteHKI,
);`,
    replacement: `router.delete(
  "/:id",
  authenticate,
  requireAnyPermission(["delete_hki", "manage_hki"]),
  validate({ params: hkiIdParamSchema }),
  controller.deleteHKI,
);
router.post(
  "/:id/restore",
  authenticate,
  requireAnyPermission(["delete_hki", "manage_hki"]),
  validate({ params: hkiIdParamSchema }),
  controller.restoreHKI,
);`
  }
]);

console.log("Phase 3.5 implementation complete!");
