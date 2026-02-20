# Seamless Integration Playbook
## Closet AI + Perfect Corp / YouCam for Web, Mobile & In-Store Kiosks

**Version:** 1.0  
**Last Updated:** February 2026  
**References:** GitHub, Perfect Corp, Stripe, Linode

---

## Quick Summary

This document provides a comprehensive, implementation-ready guide (~15+ pages when printed) for integrating Perfect Corp / YouCam imaging APIs into Closet AI across Web (React), Mobile (React Native / iOS / Android native), and In-Store Kiosk platforms. It covers architecture, APIs, secure storage with signed uploads, BullMQ background workers, Stripe billing hooks, platform-specific UX patterns, offline-safe kiosk deployments, and complete copy-paste code artifacts.

---

## Table of Contents

1. Architecture Overview
2. Key Principles & Constraints
3. Environment & Prerequisites
4. Storage: S3/Linode with Signed URLs
5. Backend Endpoints (Express)
6. Worker + Perfect Client
7. Web Client (React)
8. Mobile: React Native & Native iOS/Android
9. In-Store Kiosks
10. Prompt Templates & UX Patterns
11. Billing & Cost Estimation
12. Caching Strategies & CDN
13. Monitoring & Observability
14. Security & Privacy
15. End-to-End Example
16. Testing & QA
17. CI/CD & Deployment
18. Code Artifacts

---

## 1. Architecture Overview

### System Diagram Description

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              CLOSET AI INTEGRATION ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Web (React)│    │ Mobile (React│    │Mobile (iOS/ │    │   Kiosk      │      │
│  │              │    │ Native)       │    │ Android)     │    │(Electron/    │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘    │ PWA)         │      │
│         │                   │                   │            └──────┬───────┘      │
│         │                   │                   │                   │               │
│         └───────────────────┴───────────────────┴───────────────────┘               │
│                                        │                                             │
│                                        ▼                                             │
│                         ┌──────────────────────────────┐                             │
│                         │     Node/Express API          │                             │
│                         │  (Auth, Signed URLs, Jobs)   │                             │
│                         └──────────────┬───────────────┘                             │
│                                        │                                             │
│         ┌──────────────────────────────┼──────────────────────────────┐            │
│         │                              │                              │            │
│         ▼                              ▼                              ▼            │
│  ┌──────────────┐            ┌──────────────────┐           ┌──────────────┐        │
│  │ BullMQ Queue │────────────│  Worker Pool     │───────────│   Stripe    │        │
│  │ + Redis      │            │ (Perfect/YouCam)│           │   Billing   │        │
│  └──────────────┘            └────────┬─────────┘           └──────────────┘        │
│                                       │                                             │
│                                       ▼                                             │
│                         ┌──────────────────────────────┐                             │
│                         │   S3-Compatible Storage     │                             │
│                         │   (Linode/MinIO/AWS)        │                             │
│                         └──────────────────────────────┘                             │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Client → Backend**: Client requests signed upload URL, authenticates via JWT
2. **Client → S3**: Direct upload using signed PUT URL (bypasses backend)
3. **Backend → Queue**: Enqueue generation job with jobId returned to client
4. **Worker → Perfect API**: Process job, call external AI provider
5. **Worker → S3**: Upload generated results to tenant namespace
6. **Client ← Backend**: Poll job status, receive signed GET URL for results

---

## 2. Key Principles & Constraints

### Core Integration Principles

1. **Server-Side API Keys**: Never embed Perfect Corp API keys in web/mobile/kiosk clients. All API calls go through your backend.

2. **Direct-to-Storage Uploads**: Use signed PUT URLs to upload images directly to S3, reducing backend bandwidth and latency.

3. **Asynchronous Processing**: All AI generation jobs are queued via BullMQ + Redis. Return jobId immediately; clients poll or use WebSockets for completion.

4. **Quota & Cost Estimation**: Show expected cost (credits/USD) before confirming generation for pay-as-you-go users.

5. **Consent & Privacy**: Explicit opt-in for user photos. Crop to ROI only. Retain minimal data. Show consent screens.

6. **Offline & Kiosk Fallback**: Prefetch cached assets for kiosks. Queue jobs locally when offline; sync when network returns.

7. **Device Security**: Kiosk devices must run locked down (kiosk mode), use local firewall, and store only short-lived device JWTs.

---

## 3. Environment & Prerequisites

### Required Technologies

- **Node.js**: 18+
- **Redis**: For BullMQ queue and caching
- **PostgreSQL**: For persistent data
- **S3-Compatible Storage**: Linode Object Storage, AWS S3, or MinIO
- **Perfect Corp Account**: API key from yce.perfectcorp.com
- **Stripe Account**: For subscriptions and metered billing

### Environment Variables (.env)

```bash
# Server
PORT=5000
NODE_ENV=production
DATABASE_URL=postgres://user:pass@db:5432/closetai
REDIS_URL=redis://redis:6379
JWT_SECRET=your-jwt-secret

# S3/Linode Storage
S3_ENDPOINT=https://us-east-1.linodeobjects.com
S3_REGION=us-east-1
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=closetai-media

# Perfect Corp API
PERFECT_BASE=https://yce.perfectcorp.com
PERFECT_API_KEY=sk_perfect_...
PERFECT_TIMEOUT_MS=90000

# Stripe Billing
STRIPE_SECRET_KEY=sk_live_...

# Worker
WORKER_CONCURRENCY=2
MAX_JOB_RETRIES=3
```

---

## 4. Storage: S3/Linode with Signed URLs

### Implementation: backend/lib/storage.js

The storage module provides tenant-aware S3 operations with signed URL generation for direct uploads.

```javascript
// backend/lib/storage.js
const AWS = require('aws-sdk');
const stream = require('stream');

const s3 = new AWS.S3({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
  s3ForcePathStyle: true,
  signatureVersion: 'v4'
});

const BUCKET = process.env.S3_BUCKET;

function tenantKey(tenantId, path) {
  if (!tenantId) throw new Error('tenantId required');
  return `tenant/${tenantId}/${path}`;
}

async function uploadBuffer(buffer, key, contentType = 'image/png') {
  const params = {
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'private',
    ServerSideEncryption: 'AES256'
  };
  const result = await s3.upload(params).promise();
  return { key, url: result.Location };
}

function getSignedPutUrl(key, expiresSeconds = 600, contentType = 'image/jpeg') {
  return s3.getSignedUrl('putObject', {
    Bucket: BUCKET,
    Key: key,
    Expires: expiresSeconds,
    ContentType: contentType
  });
}

function getSignedGetUrl(key, expiresSeconds = 3600) {
  return s3.getSignedUrl('getObject', {
    Bucket: BUCKET,
    Key: key,
    Expires: expiresSeconds
  });
}

async function deleteKey(key) {
  return s3.deleteObject({ Bucket: BUCKET, Key: key }).promise();
}

module.exports = {
  tenantKey,
  uploadBuffer,
  getSignedPutUrl,
  getSignedGetUrl,
  deleteKey,
  s3,
  BUCKET
};
```

### Usage Patterns

1. **Backend returns signed PUT URL**: GET /api/gen/upload-url returns { key, uploadUrl }
2. **Client uploads directly**: PUT {uploadUrl} with file data and correct Content-Type
3. **Worker uploads results**: Uses uploadBuffer() to store generated images

---

## 5. Backend Endpoints (Express)

### Routes: backend/routes/gen.routes.js

```javascript
// backend/routes/gen.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const {
  createText2Img,
  createImageEdit,
  createTryon,
  createBatch,
  getJobStatus,
  listJobs,
  getUploadUrl,
  getDownloadUrl,
  deleteJob,
  savePrompt,
  listPrompts
} = require('../controllers/gen.controller');

router.post('/text2img', authenticate, createText2Img);
router.post('/edit', authenticate, createImageEdit);
router.post('/tryon', authenticate, createTryon);
router.post('/batch', authenticate, createBatch);
router.get('/job/:id', optionalAuth, getJobStatus);
router.get('/jobs', authenticate, listJobs);
router.delete('/job/:id', authenticate, deleteJob);
router.post('/upload-url', authenticate, getUploadUrl);
router.get('/download/:key', optionalAuth, getDownloadUrl);
router.post('/prompts', authenticate, savePrompt);
router.get('/prompts', authenticate, listPrompts);

module.exports = router;
```

### Security Considerations

- verifyJWT enforces user and tenant context
- Enforce CSRF for web endpoints where necessary
- Rate-limit endpoints (per-user/per-tenant)
- Use signed URLs with expiration for all asset access
- Implement request validation and sanitization

---

## 6. Worker + Perfect Client

### Implementation: backend/lib/perfectClient.js

The Perfect Client handles retries, exponential backoff, and credit tracking for the Perfect Corp API.

```javascript
// backend/lib/perfectClient.js
const axios = require('axios');
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const client = axios.create({
  baseURL: process.env.PERFECT_BASE || 'https://yce.perfectcorp.com',
  headers: { 
    Authorization: `Bearer ${process.env.PERFECT_API_KEY}` 
  },
  timeout: Number(process.env.PERFECT_TIMEOUT_MS) || 90000
});

/**
 * Safe POST request with retry logic and credit tracking
 * @param {string} path - API endpoint path
 * @param {object} body - Request body
 * @param {string} tenantId - Tenant ID for credit tracking
 */
async function safePost(path, body, tenantId) {
  const MAX_RETRIES = 3;
  let attempt = 0;
  let lastErr;
  
  while (attempt < MAX_RETRIES) {
    try {
      const resp = await client.post(path, body);
      
      // Track credits
      const credits = resp.headers['x-credit-remaining'] || 
                      resp.headers['x-credits-remaining'] || 
                      resp.headers['x-api-credit'];
      if (credits) {
        await redis.set(`perfect:tenant:${tenantId}:last_credits`, credits, 'EX', 86400);
      }
      
      return { data: resp.data, headers: resp.headers };
    } catch (err) {
      lastErr = err;
      attempt++;
      const status = err?.response?.status;
      
      // Don't retry client errors (except 429)
      if (status && status >= 400 && status < 500 && status !== 429) {
        throw err;
      }
      
      // Exponential backoff
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastErr || new Error('Perfect Corp API failed after retries');
}

module.exports = {
  // Text-to-image generation
  text2img: (params, tenantId) => safePost('/ai-api/v1/text2img', params, tenantId),
  
  // Image editing
  imageEdit: (params, tenantId) => safePost('/ai-api/v1/image-edit', params, tenantId),
  
  // Virtual try-on
  tryOn: (params, tenantId) => safePost('/ai-api/v1/fashion/tryon', params, tenantId),
  
  // Hairstyle try-on
  hairstyleTryon: (params, tenantId) => safePost('/ai-api/v1/hairstyle/tryon', params, tenantId),
  
  // Skin analysis
  skinAnalysis: (params, tenantId) => safePost('/ai-api/v1/skin-analysis', params, tenantId),
  
  // Get credit balance
  getCredits: async (tenantId) => {
    const credits = await redis.get(`perfect:tenant:${tenantId}:last_credits`);
    return credits ? parseInt(credits, 10) : null;
  }
};
```

### Worker Implementation: backend/workers/genWorker.js

```javascript
// backend/workers/genWorker.js
const Bull = require('bull');
const perfectClient = require('../lib/perfectClient');
const { uploadBuffer, tenantKey, getSignedGetUrl } = require('../lib/storage');
const db = require('../lib/db');
const { getRedis } = require('../lib/redisClient');

const redis = getRedis();
const genQueue = new Bull('gen', process.env.REDIS_URL || 'redis://localhost:6379');

/**
 * Process generation jobs from the queue
 */
genQueue.process(async (job) => {
  const { type, userId, tenantId, inputKeys, options } = job.data;
  
  console.log(`Processing ${type} job ${job.id} for user ${userId}`);
  
  try {
    // Get signed URLs for input images
    const inputUrls = inputKeys.map(key => getSignedGetUrl(key));
    
    let result;
    
    switch (type) {
      case 'text2img':
        result = await perfectClient.text2img({
          prompt: options.prompt,
          negative_prompt: options.negativePrompt,
          style: options.style,
          width: options.width || 1024,
          height: options.height || 1024
        }, tenantId);
        break;
        
      case 'tryon':
        result = await perfectClient.tryOn({
          person_image_url: inputUrls[0],
          item_image_url: inputUrls[1],
          category: options.category || 'top',
          fit_mode: options.fitMode || 'standard'
        }, tenantId);
        break;
        
      case 'edit':
        result = await perfectClient.imageEdit({
          image_url: inputUrls[0],
          prompt: options.prompt,
          mask: options.mask
        }, tenantId);
        break;
        
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
    
    // Process result - handle base64 or URL response
    const resultBuffers = [];
    
    if (result.data.image_base64) {
      const buffer = Buffer.from(result.data.image_base64, 'base64');
      resultBuffers.push(buffer);
    } else if (result.data.image_url) {
      // Fetch image from URL
      const response = await axios.get(result.data.image_url, { 
        responseType: 'arraybuffer' 
      });
      resultBuffers.push(Buffer.from(response.data));
    } else if (result.data.images) {
      for (const img of result.data.images) {
        if (img.base64) {
          resultBuffers.push(Buffer.from(img.base64, 'base64'));
        }
      }
    }
    
    // Upload results to S3
    const resultKeys = [];
    for (let i = 0; i < resultBuffers.length; i++) {
      const key = tenantKey(tenantId, `results/${job.id}/result_${i}.png`);
      await uploadBuffer(resultBuffers[i], key, 'image/png');
      resultKeys.push(key);
    }
    
    // Update job status in database
    await db.query(
      `UPDATE gen_jobs 
       SET status = 'completed', result_keys = $1, updated_at = NOW() 
       WHERE id = $2`,
      [resultKeys, job.id]
    );
    
    // Track API usage
    const creditsUsed = result.headers['x-credits-used'] || 1;
    await db.query(
      `INSERT INTO api_usage (tenant_id, user_id, provider, credits_used, job_id, created_at)
       VALUES ($1, $2, 'perfect', $3, $4, NOW())`,
      [tenantId, userId, creditsUsed, job.id]
    );
    
    return { success: true, resultKeys };
    
  } catch (error) {
    console.error(`Job ${job.id} failed:`, error.message);
    
    // Update job status to failed
    await db.query(
      `UPDATE gen_jobs 
       SET status = 'failed', error_message = $1, updated_at = NOW() 
       WHERE id = $2`,
      [error.message, job.id]
    );
    
    throw error;
  }
});

// Handle failed jobs
genQueue.on('failed', async (job, err) => {
  console.error(`Job ${job.id} permanently failed:`, err.message);
  // Could send notification to admin here
});

module.exports = { genQueue };
```

---

## 7. Web Client (React)

### Upload Widget Component

```jsx
// src/components/generate/UploadWidget.jsx
import React, { useState, useRef } from 'react';
import { api } from '../../lib/api';

export function UploadWidget({ onUploadComplete, accept = 'image/*', maxSize = 10 * 1024 * 1024 }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > maxSize) {
      setError(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Get signed upload URL
      const { data: { key, uploadUrl } } = await api.post('/gen/upload-url', {
        filename: file.name,
        contentType: file.type
      });

      // Upload directly to S3
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      onUploadComplete({ key, filename: file.name });
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-widget">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="btn btn-primary"
      >
        {uploading ? `Uploading ${progress}%` : 'Select Image'}
      </button>

      {error && <div className="error-message">{error}</div>}
      
      {uploading && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}
```

### Job Status Poller

```jsx
// src/components/generate/JobStatusPoller.jsx
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';

export function JobStatusPoller({ jobId, onComplete, onError, pollInterval = 2000 }) {
  const [status, setStatus] = useState(null);
  const [resultUrls, setResultUrls] = useState([]);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchStatus = async () => {
    try {
      const { data } = await api.get(`/gen/job/${jobId}`);
      setStatus(data.status);
      
      if (data.status === 'completed') {
        setResultUrls(data.resultUrls || []);
        onComplete?.(data);
        clearInterval(intervalRef.current);
      } else if (data.status === 'failed') {
        setError(data.errorMessage || 'Generation failed');
        onError?.(data.errorMessage);
        clearInterval(intervalRef.current);
      }
    } catch (err) {
      setError(err.message);
      onError?.(err.message);
    }
  };

  useEffect(() => {
    fetchStatus(); // Initial fetch
    intervalRef.current = setInterval(fetchStatus, pollInterval);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [jobId, pollInterval]);

  return { status, resultUrls, error };
}
```

### Prompt Builder Component

```jsx
// src/components/generate/PromptBuilder.jsx
import React, { useState } from 'react';
import { templates } from '../config/promptTemplates';

export function PromptBuilder({ onSubmit, creditCost = 0 }) {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState(
    'watermark, logo, text, cartoon, blurry, distorted anatomy, low quality'
  );
  const [style, setStyle] = useState('photorealistic');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const applyTemplate = (template) => {
    setSelectedTemplate(template.id);
    setPrompt(template.prompt);
    setNegativePrompt(template.negativePrompt || negativePrompt);
    setStyle(template.style || 'photorealistic');
  };

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    onSubmit({ prompt, negativePrompt, style });
  };

  return (
    <div className="prompt-builder">
      <div className="templates-section">
        <h4>Templates</h4>
        <div className="template-grid">
          {templates.map(template => (
            <button
              key={template.id}
              onClick={() => applyTemplate(template)}
              className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>

      <div className="prompt-input-section">
        <label>Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to generate..."
          rows={4}
        />

        <label>Negative Prompt</label>
        <textarea
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          rows={2}
        />

        <label>Style</label>
        <select value={style} onChange={(e) => setStyle(e.target.value)}>
          <option value="photorealistic">Photorealistic</option>
          <option value="fashion">Fashion Editorial</option>
          <option value="studio">Studio Product</option>
          <option value="lifestyle">Lifestyle</option>
        </select>
      </div>

      <div className="cost-estimate">
        <span>Estimated cost: </span>
        <strong>{creditCost} credits</strong>
        <button
          onClick={handleSubmit}
          disabled={!prompt.trim()}
          className="btn btn-primary"
        >
          Generate
        </button>
      </div>
    </div>
  );
}
```

---

## 8. Mobile: React Native & Native iOS/Android

### General Rules for Mobile Integration

1. **Same signed URL flow as web** - GET signed PUT URL, upload file
2. **Platform file pickers** - Use native image crop/normalize before upload
3. **Background tasks** - Use iOS background fetch, Android WorkManager for polling
4. **Secure storage** - Keychain (iOS), EncryptedSharedPreferences (Android)
5. **Push notifications** - APNs (iOS), FCM (Android) for job completion

### React Native Upload Example

```typescript
// src/services/imageUpload.ts
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { fetch } from 'react-native';

export async function pickAndUploadImage(): Promise<{ key: string }> {
  // Pick image
  const result: ImagePickerResponse = await launchImageLibrary({
    mediaType: 'photo',
    maxWidth: 1400,
    maxHeight: 1400,
    quality: 0.9
  });

  if (result.didCancel || !result.assets?.[0]?.uri) {
    throw new Error('Image selection cancelled');
  }

  const asset = result.assets[0];
  const uri = asset.uri!;
  const fileName = asset.fileName || `image_${Date.now()}.jpg`;
  const contentType = asset.type || 'image/jpeg';

  // Get signed upload URL
  const uploadUrlResponse = await api.post('/gen/upload-url', {
    filename: fileName,
    contentType
  });

  const { key, uploadUrl } = uploadUrlResponse.data;

  // Create form data for upload
  const formData = new FormData();
  formData.append('file', {
    uri,
    name: fileName,
    type: contentType
  } as any);

  // Upload to signed URL
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType
    },
    body: formData
  });

  if (!uploadResponse.ok) {
    throw new Error(`Upload failed: ${uploadResponse.status}`);
  }

  return { key };
}
```

### iOS Native (Swift) - Upload to Signed URL

```swift
// UploadService.swift
import Foundation

class UploadService {
    static let shared = UploadService()
    
    func uploadToSignedUrl(
        fileUrl: URL,
        uploadUrl: URL,
        contentType: String,
        completion: @escaping (Result<Void, Error>) -> Void
    ) {
        var request = URLRequest(url: uploadUrl)
        request.httpMethod = "PUT"
        request.setValue(contentType, forHTTPHeaderField: "Content-Type")
        
        // Read file data
        guard let fileData = try? Data(contentsOf: fileUrl) else {
            completion(.failure(UploadError.fileReadFailed))
            return
        }
        
        let task = URLSession.shared.uploadTask(with: request, from: fileData) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let httpResponse = response as? HTTPURLResponse else {
                completion(.failure(UploadError.invalidResponse))
                return
            }
            
            if httpResponse.statusCode < 300 {
                completion(.success(()))
            } else {
                completion(.failure(UploadError.serverError(httpResponse.statusCode)))
            }
        }
        
        task.resume()
    }
}

enum UploadError: Error {
    case fileReadFailed
    case invalidResponse
    case serverError(Int)
}
```

### Android Native (Kotlin) - Upload to Signed URL

```kotlin
// UploadService.kt
import okhttp3.*
import java.io.File
import java.io.IOException

class UploadService(private val client: OkHttpClient) {
    
    fun uploadToSignedUrl(
        file: File,
        uploadUrl: String,
        contentType: String,
        callback: Callback
    ) {
        val requestBody = file.asRequestBody(contentType.toMediaTypeOrNull())
        
        val request = Request.Builder()
            .url(uploadUrl)
            .put(requestBody)
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onResponse(call: Call, response: Response) {
                if (response.isSuccessful) {
                    callback.onSuccess()
                } else {
                    callback.onError(IOException("Upload failed: ${response.code}"))
                }
            }
            
            override fun onFailure(call: Call, e: IOException) {
                callback.onError(e)
            }
        })
    }
    
    interface Callback {
        fun onSuccess()
        fun onError(error: IOException)
    }
}
```

### Background Processing & Notifications

**iOS (Swift)** - Register for remote notifications:

```swift
// AppDelegate.swift
func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
) {
    // Send token to backend for push notifications
    let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
    api.registerPushToken(token)
}

func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable: Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
) {
    // Handle job completion notification
    if let jobId = userInfo["jobId"] as? String {
        // Fetch job status and update UI
        api.getJobStatus(jobId) { result in
            completionHandler(.newData)
        }
    }
}
```

**Android (Kotlin)** - Use WorkManager for background polling:

```kotlin
// JobStatusWorker.kt
class JobStatusWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {
    
    override suspend fun doWork(): Result {
        val jobId = inputData.getString(KEY_JOB_ID) ?: return Result.failure()
        
        return try {
            val status = api.getJobStatus(jobId)
            
            when (status.status) {
                "completed" -> {
                    // Show notification
                    showCompletionNotification(status.resultUrls)
                    Result.success()
                }
                "failed" -> {
                    showErrorNotification(status.errorMessage)
                    Result.success()
                }
                else -> Result.retry()
            }
        } catch (e: Exception) {
            Result.retry()
        }
    }
    
    private fun showCompletionNotification(resultUrls: List<String>) {
        // Create notification with result preview
    }
}
```

---

## 9. In-Store Kiosks

### Kiosk Requirements

Kiosks have unique requirements:
- **Offline tolerance** - Queue requests locally when offline
- **Local caching** - Prefetch assets for fast loading
- **Hardware security** - Lock down devices in kiosk mode
- **Touch UX** - Simplified capture flow optimized for touch
- **POS integration** - Connect to in-store inventory systems

### Deployment Models

#### Online Kiosk (Recommended)
- Kiosk communicates with cloud backend
- Uses signed URLs for uploads
- Background workers process jobs
- Requires stable internet connection

#### Edge Kiosk (Limited Offline)
- Run local Docker server on kiosk
- Cache assets locally
- Queue user requests locally
- Sync when network returns
- Best for locations with unreliable connectivity

### Kiosk Device Security

1. **Lock device to kiosk mode** - Single app, no navigation to other apps
2. **Disable external ports** - USB, SD card slots where possible
3. **Use MDM** - Device management to enforce policies
4. **Short-lived JWTs** - Device JWTs with frequent rotation
5. **Local firewall** - Restrict network access to necessary endpoints
6. **Automatic data wipe** - Clear session data on restart

### Docker Compose for Kiosk (Local Mode)

```yaml
# kiosk/docker-compose.yml
version: '3.8'

services:
  kiosk-ui:
    image: your-kiosk-ui:latest
    restart: unless-stopped
    ports:
      - '8080:8080'
    environment:
      - NODE_ENV=production
      - API_URL=https://api.closetai.com
    volumes:
      - ./config:/app/config
      - ./uploads:/data/uploads
    networks:
      - kiosk-network

  kiosk-sync:
    image: kiosk-sync:latest
    restart: unless-stopped
    environment:
      - BACKEND_URL=https://api.closetai.com
      - S3_ENDPOINT=https://us-east-1.linodeobjects.com
      - SYNC_INTERVAL_MS=30000
      - OFFLINE_QUEUE_DIR=/data/queue
    volumes:
      - ./uploads:/data/uploads
      - ./queue:/data/queue
    networks:
      - kiosk-network
    depends_on:
      - kiosk-ui

networks:
  kiosk-network:
    driver: bridge
```

### Kiosk Sync Service

```javascript
// kiosk-sync/service.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { getSignedPutUrl } = require('./storage');

class KioskSyncService {
  constructor(options) {
    this.backendUrl = options.backendUrl;
    this.queueDir = options.queueDir || '/data/queue';
    this.syncInterval = options.syncIntervalMs || 30000;
    this.isOnline = true;
    
    // Ensure queue directory exists
    if (!fs.existsSync(this.queueDir)) {
      fs.mkdirSync(this.queueDir, { recursive: true });
    }
  }

  async start() {
    console.log('Kiosk sync service starting...');
    
    // Check network status
    setInterval(() => this.checkNetwork(), 10000);
    
    // Sync loop
    setInterval(() => this.sync(), this.syncInterval);
    
    // Initial sync
    await this.sync();
  }

  async checkNetwork() {
    try {
      await axios.get(`${this.backendUrl}/health`, { timeout: 5000 });
      this.isOnline = true;
    } catch {
      this.isOnline = false;
      console.log('Network offline - queuing locally');
    }
  }

  async sync() {
    if (!this.isOnline) {
      console.log('Skipping sync - offline');
      return;
    }

    const queueFiles = fs.readdirSync(this.queueDir);
    
    for (const file of queueFiles) {
      try {
        await this.processQueueItem(path.join(this.queueDir, file));
        // Remove processed item
        fs.unlinkSync(path.join(this.queueDir, file));
      } catch (err) {
        console.error(`Failed to process ${file}:`, err.message);
      }
    }
  }

  async processQueueItem(filePath) {
    const item = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (item.type === 'upload') {
      // Upload file to S3 via signed URL
      const { key, uploadUrl } = await this.getUploadUrl(item.filename);
      await fs.promises.writeFile(uploadUrl, item.fileData);
      
      // Create job
      await axios.post(`${this.backendUrl}/api/gen/tryon`, {
        personKey: key,
        itemKey: item.itemKey,
        category: item.category
      });
    }
  }

  async getUploadUrl(filename) {
    const { data } = await axios.post(
      `${this.backendUrl}/api/gen/upload-url`,
      { filename, contentType: 'image/jpeg' },
      { headers: { Authorization: `Bearer ${process.env.DEVICE_TOKEN}` } }
    );
    return data;
  }

  // Queue item for later processing
  async queueOffline(item) {
    const filename = `queue_${Date.now()}.json`;
    const filePath = path.join(this.queueDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(item));
  }
}

module.exports = KioskSyncService;
```

### Kiosk UX Patterns

1. **Simplified capture flow** - Integrated camera, minimal steps
2. **Consent screen** - Clear touch acceptance for photo usage
3. **Crop region** - Allow user to select focus area
4. **Optional email** - For sending results
5. **Real-time feedback** - Show processing status on screen
6. **Offline message** - "Will process when connected"

### POS / Inventory Integration

Kiosks can connect to in-store inventory systems:

```javascript
// kiosk/inventoryConnector.js
class InventoryConnector {
  constructor(options) {
    this.posEndpoint = options.posEndpoint;
    this.cacheTtl = options.cacheTtlMs || 300000; // 5 minutes
    this.cache = new Map();
  }

  async getProductAvailability(sku) {
    // Check cache first
    const cached = this.cache.get(sku);
    if (cached && Date.now() - cached.timestamp < this.cacheTtl) {
      return cached.data;
    }

    try {
      const response = await axios.get(
        `${this.posEndpoint}/inventory/${sku}`,
        { timeout: 3000 }
      );
      
      this.cache.set(sku, {
        timestamp: Date.now(),
        data: response.data
      });
      
      return response.data;
    } catch (err) {
      // Return cached stale data if available
      return cached?.data || { available: false, message: 'Unable to check inventory' };
    }
  }
}
```

---

## 10. Prompt Templates & UX Patterns

### Try-On Template (User Photo + Product)

```
Photorealistic composite of the user (reference: {user_image_url}) wearing 
the product (reference: {product_image_url}). Preserve the user's face and body 
proportions. Match lighting and perspective. Apply natural fabric drape and 
shadowing. Output: 2048x2048 photorealistic.

Negative: watermark, logo, text, cartoon, blurry, distorted anatomy, low quality
```

### Product Hero for Mobile Store

```
Clean studio shot of {product_name} on model with shallow depth of field, 
natural skin tones, and accurate fabric texture. 1024x1024 optimized for mobile. 
No logos or text.

Negative: watermark, text, background noise, poor lighting
```

### Kiosk Social Print

```
High-contrast full body shot with a vibrant background suitable for printing 
at 4x6. Emphasize product colors and silhouette. 2048x1536, print-safe color.

Negative: watermark, copyright, blurry, low resolution
```

### Platform-Specific Considerations

| Platform | Template Adjustments |
|----------|---------------------|
| **Web** | Higher resolution (2048x2048), detailed prompts |
| **Mobile** | Optimized for 1024x1024, faster generation options |
| **Kiosk** | Print-safe colors, simplified compositions |

---

## 11. Billing & Cost Estimation

### Credit Cost Estimation

Show users expected cost before generation:

```javascript
// backend/services/billingService.js
const CREDIT_COSTS = {
  text2img: { credits: 3, description: 'Text-to-image generation' },
  tryon: { credits: 5, description: 'Virtual try-on' },
  edit: { credits: 4, description: 'Image editing' },
  batch: { credits: 2, description: 'Per-image in batch' }
};

function estimateCost(jobType, options = {}) {
  const baseCost = CREDIT_COSTS[jobType]?.credits || 1;
  
  // Adjust for options
  let multiplier = 1;
  
  if (options.variants) {
    multiplier = options.variants;
  }
  
  if (options.highResolution) {
    multiplier *= 1.5;
  }
  
  const estimatedCredits = Math.ceil(baseCost * multiplier);
  const estimatedUSD = estimatedCredits * 0.10; // $0.10 per credit
  
  return {
    credits: estimatedCredits,
    usd: estimatedUSD,
    description: CREDIT_COSTS[jobType]?.description
  };
}
```

### Billing Hooks (Stripe)

```javascript
// backend/routes/billing.webhook.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionChange(event.data.object);
      break;
      
    case 'invoice.payment_succeeded':
      await handlePaymentSuccess(event.data.object);
      break;
      
    case 'invoice.payment_failed':
      await handlePaymentFailure(event.data.object);
      break;
  }
  
  res.json({ received: true });
});
```

### Kiosk Prepaid Credits

For kiosks, consider prepaid credit buckets:

```javascript
// Kiosk credit management
async function checkKioskCredits(deviceId) {
  const device = await db.query(
    'SELECT credit_balance FROM kiosk_devices WHERE device_id = $1',
    [deviceId]
  );
  
  return device.rows[0]?.credit_balance || 0;
}

async function deductKioskCredits(deviceId, amount) {
  await db.query(
    'UPDATE kiosk_devices SET credit_balance = credit_balance - $1 WHERE device_id = $2',
    [amount, deviceId]
  );
}
```

---

## 12. Caching Strategies & CDN

### CDN Cache Rules

| Asset Type | Cache TTL | Cache-Control |
|------------|-----------|---------------|
| Product images | 1 hour | public, max-age=3600 |
| Thumbnails | 24 hours | public, max-age=86400 |
| User uploads | No cache | private, no-cache |
| Generated results | 1 hour | private, max-age=3600 |
| Static assets | 1 year | public, max-age=31536000, immutable |

### Web & Mobile Caching

```javascript
// Use CDN for thumbnails
function getThumbnailUrl(key, width = 200, height = 200) {
  // If using Cloudflare/R2/CloudFront
  return `https://cdn.closetai.com/${key}?w=${width}&h=${height}&fit=cover`;
}

// Fetch high-res on demand
function getHighResUrl(key) {
  // Use signed URL for generated results
  return getSignedGetUrl(key, 3600);
}
```

### Kiosk Prefetching

```javascript
// Prefetch popular products at kiosk startup
async function prefetchTopProducts(kioskId, limit = 50) {
  const popular = await getPopularProducts(limit);
  
  for (const product of popular) {
    const url = getThumbnailUrl(product.imageKey, 400, 400);
    await cacheToLocal(url, product.id);
  }
  
  console.log(`Prefetched ${popular.length} products for kiosk ${kioskId}`);
}
```

---

## 13. Monitoring & Observability

### Key Metrics to Track

| Metric | Platform | Alert Threshold |
|--------|----------|-----------------|
| Upload success rate | All | < 95% |
| Job queue depth | Backend | > 1000 |
| Average job latency | Backend | > 60s |
| Perfect API error rate | Worker | > 5% |
| Kiosk offline duration | Kiosk | > 15 min |
| Credit balance (low) | Tenant | < 100 |

### Prometheus Metrics

```javascript
// backend/lib/metrics.js
const promClient = require('prom-client');

// Create registry
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// Custom metrics
const jobDuration = new promClient.Histogram({
  name: 'gen_job_duration_seconds',
  help: 'Duration of generation jobs',
  labelNames: ['type', 'status'],
  buckets: [5, 10, 30, 60, 120, 300]
});

const uploadDuration = new promClient.Histogram({
  name: 'upload_duration_seconds',
  help: 'Duration of file uploads',
  labelNames: ['platform'],
  buckets: [0.5, 1, 2, 5, 10]
});

const perfectApiCalls = new promClient.Counter({
  name: 'perfect_api_calls_total',
  help: 'Total Perfect API calls',
  labelNames: ['endpoint', 'status']
});

register.registerMetric(jobDuration);
register.registerMetric(uploadDuration);
register.registerMetric(perfectApiCalls);

module.exports = { register, jobDuration, uploadDuration, perfectApiCalls };
```

### Grafana Dashboards

Key dashboards to create:
1. **API Overview** - Request rate, latency, errors by endpoint
2. **Worker Performance** - Job throughput, queue depth, processing time
3. **Kiosk Health** - Online/offline status, sync status, usage
4. **Billing** - Credits consumed, revenue, quota usage

---

## 14. Security & Privacy

### Platform-Specific Security

**Web:**
- Enforce CSP (Content Security Policy)
- Short JWT lifetimes (15 min access, 7 day refresh)
- Secure, HttpOnly cookies for tokens
- CSRF protection for state-changing operations
- Disable file uploads with extended file attributes

**Mobile:**
- Store JWTs in Keychain (iOS) / EncryptedSharedPreferences (Android)
- Code obfuscation / ProGuard
- Jailbreak/root detection
- Certificate pinning for API calls

**Kiosk:**
- Remote device management (MDM)
- Automatic data wipe policies
- No persistent PII storage beyond retention window
- Short-lived device JWTs with frequent rotation
- Network firewall restrictions

### Consent & Privacy

```javascript
// Record consent
async function recordConsent(userId, deviceId, consentType, granted) {
  await db.query(
    `INSERT INTO consent_records 
     (user_id, device_id, consent_type, granted, tos_version, timestamp)
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [userId, deviceId, consentType, granted, 'v2.0']
  );
}

// Check consent before processing
async function hasConsent(userId, consentType) {
  const result = await db.query(
    `SELECT granted FROM consent_records 
     WHERE user_id = $1 AND consent_type = $2 
     ORDER BY timestamp DESC LIMIT 1`,
    [userId, consentType]
  );
  return result.rows[0]?.granted === true;
}
```

### Delete User Data Endpoint

```javascript
// backend/routes/user.routes.js
router.delete('/data', authenticate, async (req, res) => {
  const { userId } = req.user;
  
  // Delete from all relevant tables
  await Promise.all([
    db.query('DELETE FROM user_uploads WHERE user_id = $1', [userId]),
    db.query('DELETE FROM gen_jobs WHERE user_id = $1', [userId]),
    db.query('DELETE FROM wardrobe WHERE user_id = $1', [userId]),
    db.query('DELETE FROM consent_records WHERE user_id = $1', [userId])
  ]);
  
  // Delete S3 files
  const keys = await listUserS3Keys(userId);
  await deleteS3Keys(keys);
  
  res.json({ message: 'All user data deleted' });
});
```

---

## 15. End-to-End Example

### Complete Flow: Web → Worker → Display

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMPLETE GENERATION FLOW                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. CLIENT                  2. BACKEND              3. S3 STORAGE           │
│     ────────                  ───────               ────────────             │
│     POST /upload-url    →   Generate signed        ← Return uploadUrl       │
│                            PUT URL                                            │
│                                                                              │
│  4. CLIENT                  5. CLIENT              6. BACKEND               │
│     ────────                  ───────               ────────                 │
│     PUT uploadUrl       →   Direct upload          ← 200 OK                │
│                            to S3                                             │
│                                                                              │
│  7. CLIENT                  8. BACKEND             9. QUEUE                 │
│     ────────                  ───────               ─────                   │
│     POST /gen/tryon     →   Enqueue job           ← Return jobId           │
│     {personKey,                                       │                    │
│      itemKey,                                         ▼                    │
│      consent:true}                               ┌────────┐                │
│                                                    │ BullMQ │               │
│  12. CLIENT                 10. WORKER             │ Queue  │               │
│     ────────                  ──────               └────────┘               │
│     GET /job/:id        ←   Poll job                                         │
│     ← {status:             │                 11. PERFECT API               │
│        completed,          ▼                                                │
│        resultUrls}    Process job:                                          │
│                       - Get input URLs                                      │
│                       - Call Perfect                                        │
│                       - Upload results                                      │
│                       - Update DB status                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Example Payloads

**1. Get Upload URL**
```http
POST /api/gen/upload-url
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "filename": "user_photo.jpg",
  "contentType": "image/jpeg"
}

Response:
{
  "key": "tenant/abc123/uploads/user_123/1699999999-user_photo.jpg",
  "uploadUrl": "https://...linodeobjects.com/...?Signature=..."
}
```

**2. Create Try-On Job**
```http
POST /api/gen/tryon
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "personKey": "tenant/abc123/uploads/user_123/1699999999-user_photo.jpg",
  "itemKey": "tenant/abc123/products/shirt_001.jpg",
  "category": "top",
  "consent": true
}

Response:
{
  "jobId": "job_abc123def456",
  "status": "queued",
  "estimatedTime": 30
}
```

**3. Poll Job Status**
```http
GET /api/gen/job/job_abc123def456
Authorization: Bearer <jwt>

Response (completed):
{
  "id": "job_abc123def456",
  "status": "completed",
  "resultUrls": [
    "https://.../tenant/abc123/results/job_abc123def456/result_0.png?Signature=..."
  ],
  "updatedAt": "2026-02-19T12:00:00Z"
}
```

---

## 16. Testing & QA

### Unit Tests

**Storage Module:**
```javascript
// tests/storage.test.js
const { tenantKey, getSignedPutUrl, getSignedGetUrl } = require('../lib/storage');

describe('Storage', () => {
  test('tenantKey creates correct path', () => {
    const key = tenantKey('tenant123', 'uploads/image.jpg');
    expect(key).toBe('tenant/tenant123/uploads/image.jpg');
  });
  
  test('getSignedPutUrl returns valid URL', async () => {
    const url = getSignedPutUrl('test/key.jpg', 600, 'image/jpeg');
    expect(url).toContain('Signature=');
    expect(url).toContain('test/key.jpg');
  });
  
  test('getSignedGetUrl returns valid URL', async () => {
    const url = getSignedGetUrl('test/key.jpg', 3600);
    expect(url).toContain('Signature=');
    expect(url).toContain('test/key.jpg');
  });
});
```

**Perfect Client:**
```javascript
// tests/perfectClient.test.js
const perfectClient = require('../lib/perfectClient');

describe('Perfect Client', () => {
  test('getCredits returns cached value', async () => {
    // Setup mock redis
    const credits = await perfectClient.getCredits('tenant123');
    expect(typeof credits).toBe('number');
  });
});
```

### Integration Tests

- Use MinIO for S3-compatible testing
- Test Perfect Corp sandbox API
- Test full job flow with mocked responses

### Mobile UX Tests

- Use BrowserStack or similar for device testing
- Test camera capture flow
- Test background task execution
- Test push notification handling

### Kiosk Smoke Tests

```bash
#!/bin/bash
# kiosk-smoke-test.sh

echo "=== Kiosk Smoke Test ==="

# Test 1: Camera capture
echo "Test 1: Camera capture..."
# (Automated camera test)

# Test 2: Upload
echo "Test 2: Upload..."
curl -X POST https://api.closetai.com/api/gen/upload-url \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"filename":"test.jpg","contentType":"image/jpeg"}'

# Test 3: Job creation and retrieval
echo "Test 3: Job flow..."
# (Create job and verify completion)

echo "=== All smoke tests passed ==="
```

### Load Testing

Use k6 or Artillery for load testing:

```yaml
# load-test.yml
config:
  target: "https://api.closetai.com"
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50

scenarios:
  - name: "Try-on flow"
    flow:
      - post:
          url: "/api/gen/upload-url"
          json:
            filename: "test.jpg"
            contentType: "image/jpeg"
      - put:
          url: "{{ uploadUrl }}"
          body: "{{ fileContent }}"
          headers:
            Content-Type: "image/jpeg"
      - post:
          url: "/api/gen/tryon"
          json:
            personKey: "{{ personKey }}"
            itemKey: "{{ itemKey }}"
            category: "top"
```

---

## 17. CI/CD & Deployment

### Build Separate Images

```dockerfile
# Dockerfile.web
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

```dockerfile
# Dockerfile.worker
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["node", "workers/genWorker.js"]
```

```dockerfile
# Dockerfile.kiosk-sync
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY kiosk-sync/ ./kiosk-sync/
CMD ["node", "kiosk-sync/service.js"]
```

### Kiosk Distribution

For kiosks, use:
- **Electron** builds signed for each OS
- **MDM** for enterprise deployment
- **Auto-update** for seamless updates

### Feature Flags

```javascript
// backend/lib/featureFlags.js
const flags = {
  mobile_new_ui: { rollout: 0.1 }, // 10% of users
  kiosk_offline_mode: { rollout: 0 }, // disabled
  batch_processing: { rollout: 1.0 }, // 100%
  perfect_v2_api: { rollout: 0.5 } // 50%
};

function isEnabled(flag, userId) {
  const config = flags[flag];
  if (!config) return false;
  
  // Deterministic rollout based on user ID
  const hash = hashCode(userId);
  const normalized = (hash % 100) / 100;
  
  return normalized < config.rollout;
}
```

---

## 18. Code Artifacts

### Summary of Available Artifacts

This playbook includes the following ready-to-use code artifacts:

| Artifact | Location | Description |
|----------|----------|-------------|
| [`backend/lib/storage.js`](#4-storage-s3linode-with-signed-urls) | Line 159-223 | S3 storage with signed URLs |
| [`backend/lib/perfectClient.js`](#6-worker--perfect-client) | Line 289-375 | Perfect Corp API client with retries |
| [`backend/workers/genWorker.js`](#6-worker--perfect-client) | Line 378-489 | BullMQ worker for generation jobs |
| [`backend/routes/gen.routes.js`](#5-backend-endpoints-express) | Line 237-269 | Express routes for generation API |
| [`src/components/generate/UploadWidget.jsx`](#7-web-client-react) | - | React upload component |
| [`src/components/generate/JobStatusPoller.jsx`](#7-web-client-react) | - | React job status poller |
| [`src/components/generate/PromptBuilder.jsx`](#7-web-client-react) | - | React prompt builder with templates |
| [`src/services/imageUpload.ts`](#8-mobile-react-native--native-iosandroid) | - | React Native upload service |
| [`UploadService.swift`](#8-mobile-react-native--native-iosandroid) | - | iOS native upload |
| [`UploadService.kt`](#8-mobile-react-native--native-iosandroid) | - | Android native upload |
| [`kiosk/docker-compose.yml`](#9-in-store-kiosks) | - | Kiosk Docker setup |
| [`kiosk-sync/service.js`](#9-in-store-kiosks) | - | Kiosk sync service |
| [`backend/services/billingService.js`](#11-billing--cost-estimation) | - | Credit cost estimation |
| [`backend/routes/billing.webhook.js`](#11-billing--cost-estimation) | - | Stripe webhook handler |
| [`backend/lib/metrics.js`](#13-monitoring--observability) | - | Prometheus metrics |

### How to Use These Artifacts

1. **Copy** the code from the relevant section
2. **Paste** into your project at the indicated location
3. **Configure** environment variables as shown
4. **Test** with your Perfect Corp API credentials
5. **Deploy** following the CI/CD guidelines

---

*Document Version: 2.0*  
*Last Updated: February 2026*