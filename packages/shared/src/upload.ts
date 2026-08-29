/**
 * Upload limits, shared because three places have to agree on them: multer
 * enforces the ceiling, the error handler names it in its message, and the
 * browser checks against it before spending a minute uploading a file the API
 * will only reject.
 */

/**
 * 10MB per file.
 *
 * This is the number the dropzone advertises in the Figma reference ("Max
 * 10MB"), and the design is the reference of record — so the API enforces what
 * the UI promises rather than the other way round.
 */
export const MAX_UPLOAD_MB = 10;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
