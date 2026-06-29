export type HttpErrorMessage = string | string[];

export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly errors: unknown[];
  public readonly responseMessage: HttpErrorMessage;

  constructor(
    statusCode: number,
    message: HttpErrorMessage,
    code: string,
    errors: unknown[] = [],
  ) {
    super(Array.isArray(message) ? message.join(", ") : message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    this.responseMessage = message;
    Object.setPrototypeOf(this, HttpError.prototype);
  }

  static badRequest(
    message: HttpErrorMessage = "Permintaan tidak valid",
    errors: unknown[] = [],
    code = "VALIDATION_ERROR",
  ) {
    return new HttpError(400, message, code, errors);
  }

  static unauthorized(message = "Harap login terlebih dahulu", code = "UNAUTHORIZED") {
    return new HttpError(401, message, code);
  }

  static forbidden(message = "Akses ditolak", code = "FORBIDDEN") {
    return new HttpError(403, message, code);
  }

  static notFound(message = "Data tidak ditemukan", code = "NOT_FOUND") {
    return new HttpError(404, message, code);
  }

  static conflict(message = "Data sudah terdaftar", code = "DUPLICATE_ERROR") {
    return new HttpError(409, message, code);
  }

  static internal(message = "Terjadi kesalahan pada server", code = "INTERNAL_ERROR") {
    return new HttpError(500, message, code);
  }
}
