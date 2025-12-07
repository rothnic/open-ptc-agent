/**
 * Storage utilities module.
 *
 * Provides cloud storage integration for uploading images and files.
 * Mirrors the Python src/utils/storage package.
 */

export {
  type StorageUploader,
  type UploadOptions,
  type UploadResult,
  detectContentType,
  getStorageProvider,
  isStorageEnabled,
} from "./storage_uploader.js";

export {
  S3Uploader,
  createS3UploaderFromEnv,
  type S3Config,
} from "./s3_uploader.js";

export {
  R2Uploader,
  createR2UploaderFromEnv,
  type R2Config,
} from "./r2_uploader.js";

import { getStorageProvider, type StorageUploader } from "./storage_uploader.js";
import { createS3UploaderFromEnv } from "./s3_uploader.js";
import { createR2UploaderFromEnv } from "./r2_uploader.js";

/**
 * Get the configured storage uploader based on environment.
 *
 * @returns StorageUploader or null if not configured
 */
export function getStorageUploader(): StorageUploader | null {
  const provider = getStorageProvider()?.toLowerCase();

  switch (provider) {
    case "s3":
      return createS3UploaderFromEnv();
    case "r2":
      return createR2UploaderFromEnv();
    default:
      return null;
  }
}
