/**
 * Storage uploader base class and utilities.
 */

/**
 * Upload options.
 */
export interface UploadOptions {
  /** Content type for the upload */
  contentType?: string;

  /** Custom metadata */
  metadata?: Record<string, string>;
}

/**
 * Upload result.
 */
export interface UploadResult {
  /** Whether the upload was successful */
  success: boolean;

  /** Public URL of the uploaded file (if successful) */
  url?: string;

  /** Error message (if failed) */
  error?: string;

  /** Storage key/path of the uploaded file */
  key: string;
}

/**
 * Abstract storage uploader interface.
 */
export interface StorageUploader {
  /**
   * Upload bytes to storage.
   *
   * @param key - Storage key/path
   * @param data - Data to upload
   * @param options - Upload options
   * @returns Upload result
   */
  uploadBytes(
    key: string,
    data: Buffer | Uint8Array,
    options?: UploadOptions
  ): Promise<UploadResult>;

  /**
   * Get public URL for a storage key.
   *
   * @param key - Storage key/path
   * @returns Public URL
   */
  getPublicUrl(key: string): string;

  /**
   * Check if storage is enabled and configured.
   *
   * @returns True if storage is enabled
   */
  isEnabled(): boolean;
}

/**
 * Detect content type from file extension.
 *
 * @param filename - File name or path
 * @returns Content type string
 */
export function detectContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();

  const contentTypes: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    bmp: "image/bmp",
    tiff: "image/tiff",
    pdf: "application/pdf",
    json: "application/json",
    html: "text/html",
    css: "text/css",
    js: "application/javascript",
    txt: "text/plain",
    csv: "text/csv",
    xml: "application/xml",
    zip: "application/zip",
  };

  return contentTypes[ext || ""] || "application/octet-stream";
}

/**
 * Get storage provider from environment.
 *
 * @returns Storage provider name or undefined
 */
export function getStorageProvider(): string | undefined {
  return process.env.STORAGE_PROVIDER;
}

/**
 * Check if storage is enabled via environment.
 *
 * @returns True if a storage provider is configured
 */
export function isStorageEnabled(): boolean {
  const provider = getStorageProvider();
  return !!provider && provider !== "none";
}
