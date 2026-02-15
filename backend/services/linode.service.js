const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const env = require('../config/env');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

class LinodeStorageService {
  constructor() {
    this.useLocal = !env.linode.accessKey || !env.linode.secretKey;
    if (this.useLocal) {
      if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    } else {
      const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
      this.client = new S3Client({
        endpoint: env.linode.endpoint,
        region: 'us-sea-1',
        credentials: {
          accessKeyId: env.linode.accessKey,
          secretAccessKey: env.linode.secretKey,
        },
        forcePathStyle: false,
      });
      this.bucket = env.linode.bucket;
    }
  }

  async uploadFile(fileBuffer, fileName, userId, folder = 'originals') {
    const extension = fileName.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const randomHash = crypto.randomBytes(8).toString('hex');
    const key = `${userId}/${folder}/${timestamp}-${randomHash}.${extension}`;

    if (this.useLocal) {
      const dir = path.join(UPLOADS_DIR, path.dirname(key));
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(UPLOADS_DIR, key), fileBuffer);
      const url = `/uploads/${key}`;
      return { url, key };
    }

    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: this._getMimeType(fileName),
      ACL: 'public-read',
      Metadata: {
        userId: String(userId),
        originalName: fileName,
        uploadDate: new Date().toISOString(),
      },
    });
    await this.client.send(command);
    // Virtual-hosted style: https://bucket.region.linodeobjects.com/key
    const endpointUrl = env.linode.endpoint || '';
    const host = endpointUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const url = host ? `https://${this.bucket}.${host}/${key}` : `${endpointUrl}/${this.bucket}/${key}`;
    return { url, key };
  }

  async deleteFile(key) {
    if (this.useLocal) {
      const filePath = path.join(UPLOADS_DIR, key);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return;
    }
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
    const command = new DeleteObjectCommand({ Bucket: this.bucket, Key: key });
    await this.client.send(command);
  }

  _getMimeType(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const map = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
      webp: 'image/webp', gif: 'image/gif',
    };
    return map[ext] || 'application/octet-stream';
  }
}

module.exports = new LinodeStorageService();
