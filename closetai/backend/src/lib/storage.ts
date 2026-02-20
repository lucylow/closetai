import fs from 'fs';
import path from 'path';
import { DEMO_MODE, MINIO_BUCKET, MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY } from './env';
import Minio from 'minio';
import logger from './logger';

let client: Minio.Client | null = null;
if (!DEMO_MODE) {
  client = new Minio.Client({
    endPoint: MINIO_ENDPOINT.split(':')[0],
    port: Number(MINIO_ENDPOINT.split(':')[1] ?? 9000),
    useSSL: false,
    accessKey: MINIO_ACCESS_KEY,
    secretKey: MINIO_SECRET_KEY
  });
}

export async function uploadBuffer(key: string, buffer: Buffer, contentType = 'application/octet-stream') {
  if (DEMO_MODE) {
    const out = path.join(process.cwd(), 'backend', 'uploads', key);
    const dir = path.dirname(out);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(out, buffer);
    return { storage_path: out, url: `/uploads/${key}` };
  }
  return new Promise((resolve, reject) => {
    client!.putObject(MINIO_BUCKET, key, buffer, { 'Content-Type': contentType }, (err, etag) => {
      if (err) return reject(err);
      resolve({ storage_path: `s3://${MINIO_BUCKET}/${key}`, etag });
    });
  });
}
