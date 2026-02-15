// backend/lib/storage.js
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const debug = require('debug')('closet:storage');

function getBucket() {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) {
    throw new Error('S3_BUCKET environment variable is required for object storage');
  }
  return bucket;
}

const s3Config = {
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_KEY,
    secretAccessKey: process.env.S3_SECRET,
  },
};

// If a custom endpoint is provided (Linode), include it
if (process.env.S3_ENDPOINT) {
  s3Config.endpoint = process.env.S3_ENDPOINT.replace(/\/$/, ''); // no trailing slash
  // Most S3-compatible object stores require forcePathStyle
  s3Config.forcePathStyle = true;
}

const s3 = new S3Client(s3Config);

async function uploadBuffer(buffer, key, contentType = 'image/png', acl = 'private') {
  if (!Buffer.isBuffer(buffer)) throw new Error('uploadBuffer expects a Buffer');

  const cmd = new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: acl, // note: many S3-compatible stores ignore ACL
  });

  await s3.send(cmd);
  debug('Uploaded', key);

  // return both storage key and a signed URL (7 days) so front-end or judges can view
  const signedUrl = await getSignedUrlForKey(key, 7 * 24 * 3600);
  const publicUrl = getPublicUrlForKey(key);

  return { key, url: publicUrl, signedUrl };
}

function getPublicUrlForKey(key) {
  const bucket = getBucket();
  // If S3_ENDPOINT provided and not private CDN, construct direct URL
  if (process.env.S3_ENDPOINT) {
    const endpoint = process.env.S3_ENDPOINT.replace(/\/$/, '');
    // Minimize assumptions: if endpoint looks like an S3 host, return endpoint/bucket/key
    return `${endpoint}/${bucket}/${encodeURIComponent(key)}`;
  }
  // default S3 public url shape (note: presigned URL is safer)
  const region = process.env.S3_REGION || 'us-east-1';
  return `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`;
}

async function getSignedUrlForKey(key, expiresInSeconds = 3600) {
  const cmd = new GetObjectCommand({ Bucket: getBucket(), Key: key });
  return getSignedUrl(s3, cmd, { expiresIn: expiresInSeconds });
}

async function getObjectBuffer(key) {
  const cmd = new GetObjectCommand({ Bucket: getBucket(), Key: key });
  const resp = await s3.send(cmd);
  // resp.Body is a stream; convert to Buffer
  const chunks = [];
  const bodyStream = resp.Body;
  for await (const chunk of bodyStream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function deleteObject(key) {
  const cmd = new DeleteObjectCommand({ Bucket: getBucket(), Key: key });
  await s3.send(cmd);
  debug('Deleted', key);
  return true;
}

module.exports = {
  client: s3,
  uploadBuffer,
  getSignedUrlForKey,
  getObjectBuffer,
  deleteObject,
  getPublicUrlForKey,
};
