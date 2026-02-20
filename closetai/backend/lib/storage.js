// backend/lib/storage.js
// S3 storage helper
const AWS = require("aws-sdk");
const S3_ENDPOINT = process.env.S3_ENDPOINT;
const S3_REGION = process.env.S3_REGION || "us-east-1";
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY;
const S3_SECRET_KEY = process.env.S3_SECRET_KEY;
const S3_BUCKET = process.env.S3_BUCKET;
if (!S3_BUCKET || !S3_ACCESS_KEY || !S3_SECRET_KEY || !S3_ENDPOINT) {
  console.warn("Warning: S3 env vars not configured");
}
const s3 = new AWS.S3({
  endpoint: S3_ENDPOINT,
  accessKeyId: S3_ACCESS_KEY,
  secretAccessKey: S3_SECRET_KEY,
  region: S3_REGION,
  s3ForcePathStyle: true,
  signatureVersion: "v4"
});
function userKey(userId, path) { return "user/" + userId + "/" + path; }
function tenantKey(tenantId, path) { return "tenant/" + tenantId + "/" + path; }
function jobKey(jobId, filename) { return "jobs/" + jobId + "/" + filename; }
function getSignedPutUrl(key, expires, contentType) {
  expires = expires || 600;
  contentType = contentType || "image/jpeg";
  return s3.getSignedUrl("putObject", { Bucket: S3_BUCKET, Key: key, Expires: expires, ContentType: contentType });
}
function getSignedGetUrl(key, expires) {
  expires = expires || 3600;
  return s3.getSignedUrl("getObject", { Bucket: S3_BUCKET, Key: key, Expires: expires });
}
async function uploadBuffer(buffer, key, contentType) {
  contentType = contentType || "image/png";
  const params = { Bucket: S3_BUCKET, Key: key, Body: buffer, ContentType: contentType, ACL: "private" };
  const MAX = 3;
  for (let i = 0; i < MAX; i++) {
    try { return await s3.upload(params).promise(); }
    catch (err) { if (i === MAX - 1) throw err; await new Promise(r => setTimeout(r, 200 * Math.pow(2, i))); }
  }
}
async function deleteKey(key) { return s3.deleteObject({ Bucket: S3_BUCKET, Key: key }).promise(); }
module.exports = { userKey, tenantKey, jobKey, getSignedPutUrl, getSignedGetUrl, uploadBuffer, deleteKey };
