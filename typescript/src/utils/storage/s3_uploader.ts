/**
 * AWS S3 storage uploader.
 */

import {
  type StorageUploader,
  type UploadOptions,
  type UploadResult,
  detectContentType,
} from "./storage_uploader.js";

/**
 * S3 configuration.
 */
export interface S3Config {
  /** S3 bucket name */
  bucket: string;

  /** AWS region */
  region: string;

  /** Public URL prefix for the bucket */
  publicUrlPrefix?: string;

  /** Access key ID (defaults to AWS_ACCESS_KEY_ID env var) */
  accessKeyId?: string;

  /** Secret access key (defaults to AWS_SECRET_ACCESS_KEY env var) */
  secretAccessKey?: string;
}

/**
 * S3 storage uploader implementation.
 *
 * Note: This is a placeholder implementation. In production,
 * you would use the AWS SDK for actual S3 uploads.
 */
export class S3Uploader implements StorageUploader {
  private config: S3Config;

  constructor(config: S3Config) {
    this.config = config;
  }

  async uploadBytes(
    key: string,
    data: Buffer | Uint8Array,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      const contentType = options.contentType || detectContentType(key);

      // Placeholder: In production, use AWS SDK
      console.log(
        `[S3Uploader] Would upload ${data.length} bytes to s3://${this.config.bucket}/${key}`
      );
      console.log(`[S3Uploader] Content-Type: ${contentType}`);

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
    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
  }

  isEnabled(): boolean {
    return !!(
      this.config.bucket &&
      this.config.region &&
      (this.config.accessKeyId || process.env.AWS_ACCESS_KEY_ID)
    );
  }
}

/**
 * Create S3 uploader from environment variables.
 *
 * @returns S3Uploader or null if not configured
 */
export function createS3UploaderFromEnv(): S3Uploader | null {
  const bucket = process.env.S3_BUCKET;
  const region = process.env.AWS_REGION || "us-east-1";

  if (!bucket) {
    return null;
  }

  return new S3Uploader({
    bucket,
    region,
    publicUrlPrefix: process.env.S3_PUBLIC_URL_PREFIX,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });
}
