import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { randomUUID } from 'crypto';
import * as path from 'path';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client: Minio.Client;
  private bucket: string;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor(private configService: ConfigService) {
    this.bucket = this.configService.get('MINIO_BUCKET_NAME', 'whatsapp-media');

    const endpoint = this.configService.get('MINIO_ENDPOINT', 'minio_vps');
    const port = Number(this.configService.get('MINIO_PORT', '9000'));
    const useSSL = this.configService.get('MINIO_USE_SSL', 'false') === 'true';

    this.logger.log(
      `Initializing MinIO client: ${endpoint}:${port} (SSL: ${useSSL})`,
    );

    this.client = new Minio.Client({
      endPoint: endpoint,
      port: port,
      useSSL: useSSL,
      accessKey: this.configService.get('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: this.configService.get('MINIO_SECRET_KEY', 'minioadmin'),
      pathStyle: true,
      region: 'us-east-1',
      partSize: 5 * 1024 * 1024, // 5MB part size
    });
  }

  async onModuleInit() {
    try {
      await this.ensureBucketExists();
      this.isInitialized = true;
    } catch (error) {
      this.logger.error('Failed to initialize MinIO bucket on startup');
      this.logger.error(
        'MinIO operations will be attempted lazily on first use',
      );
      // Don't throw - allow app to start even if MinIO is not ready
    }
  }

  /**
   * Ensure bucket exists (with lazy initialization)
   */
  private async ensureBucketExists(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // If initialization is in progress, wait for it
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.doEnsureBucketExists();
    try {
      await this.initializationPromise;
      this.isInitialized = true;
    } catch (error) {
      this.initializationPromise = null;
      throw error;
    }
  }

  private async doEnsureBucketExists(): Promise<void> {
    this.logger.log(`Ensuring bucket "${this.bucket}" exists...`);

    try {
      const exists = await this.client.bucketExists(this.bucket);

      if (!exists) {
        this.logger.log(`Bucket "${this.bucket}" does not exist, creating...`);
        await this.client.makeBucket(this.bucket, 'us-east-1');
        
        // Set bucket policy to allow public read access
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucket}/*`],
            },
          ],
        };
        await this.client.setBucketPolicy(this.bucket, JSON.stringify(policy));
        
        this.logger.log(`Bucket "${this.bucket}" created successfully`);
      } else {
        this.logger.log(`Bucket "${this.bucket}" already exists`);
      }
    } catch (error: any) {
      this.logger.error(
        `Failed to ensure bucket exists: ${error.message || 'Unknown error'}`,
      );
      this.logger.error(`Error code: ${error.code || 'N/A'}`);

      // Em Docker, se chegou aqui, o bucket provavelmente já existe
      this.logger.warn(
        `Skipping bucket check due to MinIO SDK hostname limitations`,
      );
      throw error;
    }
  }

  /**
   * Get public URL for an object
   */
  getPublicUrl(objectName: string): string {
    // Prioridade: NGROK_URL > BACKEND_URL > MINIO_PUBLIC_URL > fallback MinIO
    const ngrokUrl = this.configService.get('NGROK_URL');
    const backendUrl = this.configService.get('BACKEND_URL');
    const minioPublicUrl = this.configService.get('MINIO_PUBLIC_URL');

    // Extrair apenas o nome do arquivo (sem path do bucket)
    const filename = objectName.split('/').pop() || objectName;

    if (ngrokUrl) {
      // Usar URL do ngrok se configurada (para desenvolvimento/testes)
      this.logger.debug(`Using ngrok URL: ${ngrokUrl}`);
      return `${ngrokUrl}/media/files/${filename}`;
    }

    if (backendUrl) {
      // Usar BACKEND_URL se configurado (produção)
      return `${backendUrl}/media/files/${filename}`;
    }

    if (minioPublicUrl) {
      // Usar MINIO_PUBLIC_URL se configurado
      return `${minioPublicUrl}/${this.bucket}/${objectName}`;
    }

    // Fallback para URL direta do MinIO (pode não funcionar se não for público)
    const endpoint = this.configService.get('MINIO_ENDPOINT', 'localhost');
    const port = Number(this.configService.get('MINIO_PORT', '9000'));
    const useSSL = this.configService.get('MINIO_USE_SSL', 'false') === 'true';
    const protocol = useSSL ? 'https' : 'http';
    
    this.logger.warn(
      `No public URL configured, using MinIO direct URL (may not work)`,
    );
    return `${protocol}://${endpoint}:${port}/${this.bucket}/${objectName}`;
  }

  /**
   * Upload file to MinIO (new method compatible with example)
   */
  async uploadFile(
    buffer: Buffer,
    objectName: string,
    mimeType: string,
  ): Promise<string> {
    await this.ensureBucketExists();
    
    await this.client.putObject(
      this.bucket,
      objectName,
      buffer,
      buffer.length,
      {
        'Content-Type': mimeType,
      },
    );

    return this.getPublicUrl(objectName);
  }

  /**
   * Check if file exists
   */
  async fileExists(objectName: string): Promise<boolean> {
    try {
      await this.ensureBucketExists();
      await this.client.statObject(this.bucket, objectName);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file stream
   */
  async getFileStream(objectName: string): Promise<NodeJS.ReadableStream> {
    await this.ensureBucketExists();
    return await this.client.getObject(this.bucket, objectName);
  }

  /**
   * Upload media file to MinIO (legacy method - maintained for compatibility)
   */
  async uploadMedia(
    buffer: Buffer,
    mimeType: string,
    originalFileName?: string,
  ): Promise<{ url: string; fileName: string; size: number }> {
    await this.ensureBucketExists();

    // Generate unique filename
    const extension = this.getExtensionFromMimeType(mimeType) || 
                     this.getExtensionFromFileName(originalFileName) || 
                     'bin';
    const fileName = `${randomUUID()}.${extension}`;
    const objectName = `media/${fileName}`;

    // Upload to MinIO
    await this.client.putObject(
      this.bucket,
      objectName,
      buffer,
      buffer.length,
      {
        'Content-Type': mimeType,
      },
    );

    // Return public URL
    const url = this.getPublicUrl(objectName);

    return {
      url,
      fileName: originalFileName || fileName,
      size: buffer.length,
    };
  }

  /**
   * Delete media file from MinIO (legacy method - maintained for compatibility)
   */
  async deleteMedia(objectName: string): Promise<void> {
    await this.ensureBucketExists();
    await this.client.removeObject(this.bucket, objectName);
  }

  /**
   * Get extension from MIME type
   */
  private getExtensionFromMimeType(mimeType: string): string | null {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'video/mpeg': 'mpeg',
      'video/quicktime': 'mov',
      'video/x-msvideo': 'avi',
      'audio/mpeg': 'mp3',
      'audio/mp4': 'm4a',
      'audio/ogg': 'ogg',
      'audio/wav': 'wav',
      'audio/webm': 'webm',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    };

    return mimeToExt[mimeType.toLowerCase()] || null;
  }

  /**
   * Get extension from filename
   */
  private getExtensionFromFileName(fileName?: string): string | null {
    if (!fileName) return null;
    const ext = path.extname(fileName).slice(1);
    return ext || null;
  }
}
