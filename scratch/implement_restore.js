import fs from 'node:fs';
import path from 'node:path';

// Helper to do simple search and replace on a file
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
// 1. Prodi Module
// ==========================================
editFile('new_sipriti_backend/src/modules/prodi/prodi.repository.ts', [
  {
    target: `  findOptions(): Promise<Prodi[]> {
    return Prodi.findAll({
      attributes: ["id", "kodeProdi", "namaProdi", "jenjang"],
      order: [
        ["jenjang", "ASC"],
        ["namaProdi", "ASC"],
      ],
    });
  }
}`,
    replacement: `  findOptions(): Promise<Prodi[]> {
    return Prodi.findAll({
      attributes: ["id", "kodeProdi", "namaProdi", "jenjang"],
      order: [
        ["jenjang", "ASC"],
        ["namaProdi", "ASC"],
      ],
    });
  }

  findByIdWithDeleted(id: string): Promise<Prodi | null> {
    return Prodi.findOne({ where: { id }, paranoid: false });
  }

  async restore(prodi: Prodi, transaction?: Transaction): Promise<void> {
    await prodi.restore(transaction ? { transaction } : {});
  }
}`
  }
]);

editFile('new_sipriti_backend/src/modules/prodi/prodi.service.ts', [
  {
    target: `  findOptions(): Promise<ProdiResponseDto[]> {
    return toProdiResponseList(await repository.findOptions());
  }
}`,
    replacement: `  findOptions(): Promise<ProdiResponseDto[]> {
    return toProdiResponseList(await repository.findOptions());
  }

  async restore(
    id: string,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<ProdiResponseDto> {
    const prodi = await repository.findByIdWithDeleted(id);
    if (!prodi) throw HttpError.notFound("Prodi tidak ditemukan");
    if (!prodi.deletedAt) {
      throw HttpError.badRequest("Prodi tidak dalam status terhapus");
    }
    await sequelize.transaction((trx) => repository.restore(prodi, trx));

    const after = toProdiResponse(prodi);
    auditService.persistNonBlocking({
      action: AuditAction.RESTORE,
      module: PRODI_MODULE,
      entityId: prodi.id,
      userId: user.id,
      after,
      requestId,
    });

    return after;
  }
}`
  }
]);

editFile('new_sipriti_backend/src/modules/prodi/prodi.controller.ts', [
  {
    target: `  options = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      sendSuccess(res, {
        message: "Data prodi berhasil diambil",
        data: await service.findOptions(),
      });
    } catch (err) {
      next(err);
    }
  };
}`,
    replacement: `  options = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      sendSuccess(res, {
        message: "Data prodi berhasil diambil",
        data: await service.findOptions(),
      });
    } catch (err) {
      next(err);
    }
  };

  restore = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await service.restore(
        req.params.id,
        requireAuthenticatedUser(req),
        requestId(req),
      );
      sendSuccess(res, {
        message: "Prodi berhasil dipulihkan",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };
}`
  }
]);

editFile('new_sipriti_backend/src/modules/prodi/prodi.routes.ts', [
  {
    target: `adminProdiRouter.delete(
  "/:id",
  authenticate,
  requirePermission(prodiPolicy.deletePermission),
  validate({ params: prodiIdParamSchema }),
  controller.delete,
);`,
    replacement: `adminProdiRouter.delete(
  "/:id",
  authenticate,
  requirePermission(prodiPolicy.deletePermission),
  validate({ params: prodiIdParamSchema }),
  controller.delete,
);
adminProdiRouter.post(
  "/:id/restore",
  authenticate,
  requirePermission(prodiPolicy.deletePermission),
  validate({ params: prodiIdParamSchema }),
  controller.restore,
);`
  }
]);

// ==========================================
// 2. Skema Module
// ==========================================
editFile('new_sipriti_backend/src/modules/skema/skema.repository.ts', [
  {
    target: `  findOptions(query: SkemaOptionsQueryDto): Promise<Skema[]> {
    const where = query.tipe ? { isActive: true, tipe: query.tipe } : { isActive: true };
    return Skema.findAll({
      where,
      attributes: ["id", "namaSkema", "tipe"],
      order: [
        ["tipe", "ASC"],
        ["namaSkema", "ASC"],
      ],
    });
  }
}`,
    replacement: `  findOptions(query: SkemaOptionsQueryDto): Promise<Skema[]> {
    const where = query.tipe ? { isActive: true, tipe: query.tipe } : { isActive: true };
    return Skema.findAll({
      where,
      attributes: ["id", "namaSkema", "tipe"],
      order: [
        ["tipe", "ASC"],
        ["namaSkema", "ASC"],
      ],
    });
  }

  findByIdWithDeleted(id: string): Promise<Skema | null> {
    return Skema.findOne({ where: { id }, paranoid: false });
  }

  async restore(skema: Skema, transaction?: Transaction): Promise<void> {
    await skema.restore(transaction ? { transaction } : {});
  }
}`
  }
]);

editFile('new_sipriti_backend/src/modules/skema/skema.service.ts', [
  {
    target: `  async findOptions(query: SkemaOptionsQueryDto): Promise<SkemaOptionDto[]> {
    return toSkemaOptionList(await repository.findOptions(query));
  }
}`,
    replacement: `  async findOptions(query: SkemaOptionsQueryDto): Promise<SkemaOptionDto[]> {
    return toSkemaOptionList(await repository.findOptions(query));
  }

  async restore(
    id: string,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<SkemaResponseDto> {
    const skema = await repository.findByIdWithDeleted(id);
    if (!skema) throw HttpError.notFound("Skema tidak ditemukan");
    if (!skema.deletedAt) {
      throw HttpError.badRequest("Skema tidak dalam status terhapus");
    }
    await sequelize.transaction((trx) => repository.restore(skema, trx));

    const after = toSkemaResponse(skema);
    auditService.persistNonBlocking({
      action: AuditAction.RESTORE,
      module: SKEMA_MODULE,
      entityId: skema.id,
      userId: user.id,
      after,
      requestId,
    });

    return after;
  }
}`
  }
]);

editFile('new_sipriti_backend/src/modules/skema/skema.controller.ts', [
  {
    target: `  options = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, {
        message: "Data skema berhasil diambil",
        data: await service.findOptions(skemaOptionsQuerySchema.parse(req.query)),
      });
    } catch (err) {
      next(err);
    }
  };
}`,
    replacement: `  options = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, {
        message: "Data skema berhasil diambil",
        data: await service.findOptions(skemaOptionsQuerySchema.parse(req.query)),
      });
    } catch (err) {
      next(err);
    }
  };

  restore = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await service.restore(
        req.params.id,
        requireAuthenticatedUser(req),
        requestId(req),
      );
      sendSuccess(res, {
        message: "Skema berhasil dipulihkan",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };
}`
  }
]);

editFile('new_sipriti_backend/src/modules/skema/skema.routes.ts', [
  {
    target: `adminSkemaRouter.delete("/:id", authenticate, requirePermission(skemaPolicy.deletePermission), validate({ params: skemaIdParamSchema }), controller.delete);`,
    replacement: `adminSkemaRouter.delete("/:id", authenticate, requirePermission(skemaPolicy.deletePermission), validate({ params: skemaIdParamSchema }), controller.delete);
adminSkemaRouter.post("/:id/restore", authenticate, requirePermission(skemaPolicy.deletePermission), validate({ params: skemaIdParamSchema }), controller.restore);`
  }
]);

// ==========================================
// 3. Bidang Fokus Module
// ==========================================
editFile('new_sipriti_backend/src/modules/bidangfokus/bidangfokus.repository.ts', [
  {
    target: `  findOptions(): Promise<BidangFokus[]> {
    return BidangFokus.findAll({
      attributes: ["id", "namaBidang"],
      order: [["namaBidang", "ASC"]],
    });
  }
}`,
    replacement: `  findOptions(): Promise<BidangFokus[]> {
    return BidangFokus.findAll({
      attributes: ["id", "namaBidang"],
      order: [["namaBidang", "ASC"]],
    });
  }

  findByIdWithDeleted(id: string): Promise<BidangFokus | null> {
    return BidangFokus.findOne({ where: { id }, paranoid: false });
  }

  async restore(bidangFokus: BidangFokus, transaction?: Transaction): Promise<void> {
    await bidangFokus.restore(transaction ? { transaction } : {});
  }
}`
  }
]);

editFile('new_sipriti_backend/src/modules/bidangfokus/bidangfokus.service.ts', [
  {
    target: `  async findOptions(): Promise<BidangFokusOptionDto[]> {
    return toBidangFokusOptionList(await repository.findOptions());
  }
}`,
    replacement: `  async findOptions(): Promise<BidangFokusOptionDto[]> {
    return toBidangFokusOptionList(await repository.findOptions());
  }

  async restore(
    id: string,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<BidangFokusResponseDto> {
    const bidangFokus = await repository.findByIdWithDeleted(id);
    if (!bidangFokus) throw HttpError.notFound("Bidang fokus tidak ditemukan");
    if (!bidangFokus.deletedAt) {
      throw HttpError.badRequest("Bidang fokus tidak dalam status terhapus");
    }
    await sequelize.transaction((trx) => repository.restore(bidangFokus, trx));

    const after = toBidangFokusResponse(bidangFokus);
    auditService.persistNonBlocking({
      action: AuditAction.RESTORE,
      module: BIDANG_FOKUS_MODULE,
      entityId: bidangFokus.id,
      userId: user.id,
      after,
      requestId,
    });

    return after;
  }
}`
  }
]);

editFile('new_sipriti_backend/src/modules/bidangfokus/bidangfokus.controller.ts', [
  {
    target: `  options = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, {
        message: "Data bidang fokus berhasil diambil",
        data: await service.findOptions(),
      });
    } catch (err) {
      next(err);
    }
  };
}`,
    replacement: `  options = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, {
        message: "Data bidang fokus berhasil diambil",
        data: await service.findOptions(),
      });
    } catch (err) {
      next(err);
    }
  };

  restore = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await service.restore(
        req.params.id,
        requireAuthenticatedUser(req),
        requestId(req),
      );
      sendSuccess(res, {
        message: "Bidang fokus berhasil dipulihkan",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };
}`
  }
]);

editFile('new_sipriti_backend/src/modules/bidangfokus/bidangfokus.routes.ts', [
  {
    target: `adminBidangFokusRouter.delete("/:id", authenticate, requirePermission(bidangFokusPolicy.deletePermission), validate({ params: bidangFokusIdParamSchema }), controller.delete);`,
    replacement: `adminBidangFokusRouter.delete("/:id", authenticate, requirePermission(bidangFokusPolicy.deletePermission), validate({ params: bidangFokusIdParamSchema }), controller.delete);
adminBidangFokusRouter.post("/:id/restore", authenticate, requirePermission(bidangFokusPolicy.deletePermission), validate({ params: bidangFokusIdParamSchema }), controller.restore);`
  }
]);

console.log("Master Data modules complete.");
