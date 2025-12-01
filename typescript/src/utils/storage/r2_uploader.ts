/**
 * Cloudflare R2 storage uploader.
 */

import {
  type StorageUploader,
  type UploadOptions,
  type UploadResult,
  detectContentType,
} from "./storage_uploader.js";

/**
 * R2 configuration.
 */
export interface R2Config {
  /** R2 bucket name */
  bucket: string;

  /** Cloudflare account ID */
  accountId: string;

  /** Public URL prefix for the bucket */
  publicUrlPrefix?: string;

  /** R2 access key ID */
  accessKeyId?: string;

  /** R2 secret access key */
  secretAccessKey?: string;
}

/**
 * R2 storage uploader implementation.
 *
 * Note: This is a placeholder implementation. In production,
 * you would use the AWS SDK with R2 endpoint.
 */
export class R2Uploader implements StorageUploader {
  private config: R2Config;

  constructor(config: R2Config) {
    this.config = config;
  }

  async uploadBytes(
    key: string,
    data: Buffer | Uint8Array,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      const contentType = options.contentType || detectContentType(key);

      // Placeholder: In production, use AWS SDK with R2 endpoint
      console.log(
        `[R2Uploader] Would upload ${data.length} bytes to r2://${this.config.bucket}/${key}`
      );
      console.log(`[R2Uploader] Content-Type: ${contentType}`);

      return {
        success: true,
        url: this.getPublicUrl(key),
        key,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        key,
      };
    }
  }

  getPublicUrl(key: string): string {
    if (this.config.publicUrlPrefix) {
      return `${this.config.publicUrlPrefix}/${key}`;
    }
    return `https://${this.config.bucket}.${this.config.accountId}.r2.cloudflarestorage.com/${key}`;
  }

  isEnabled(): boolean {
    return !!(
      this.config.bucket &&
      this.config.accountId &&
      (this.config.accessKeyId || process.env.R2_ACCESS_KEY_ID)
    );
  }
}

/**
 * Create R2 uploader from environment variables.
 *
 * @returns R2Uploader or null if not configured
 */
export function createR2UploaderFromEnv(): R2Uploader | null {
  const bucket = process.env.R2_BUCKET;
  const accountId = process.env.R2_ACCOUNT_ID;

  if (!bucket || !accountId) {
    return null;
  }

  return new R2Uploader({
    bucket,
    accountId,
    publicUrlPrefix: process.env.R2_PUBLIC_URL_PREFIX,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  });
}
