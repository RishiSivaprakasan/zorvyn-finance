export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const isAppError = (err: unknown): err is AppError => {
  return typeof err === 'object' && err !== null && 'statusCode' in err && 'code' in err;
};
