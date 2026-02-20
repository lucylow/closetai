/**
 * Demo & Test Script for Perfect Corp Generation API
 * 
 * This script demonstrates how to use the ClosetAI generation endpoints
 * for text-to-image, image edit, and virtual try-on flows.
 * 
 * Usage:
 *   # Setup environment
 *   export API_URL="http://localhost:5000/api"
 *   export JWT_TOKEN="your_jwt_token_here"
 *   
 *   # Run all demos
 *   node scripts/test-generation.js
 *   
 *   # Run specific demo
 *   node scripts/test-generation.js text2img
 *   node scripts/test-generation.js tryon
 *   node scripts/test-generation.js admin
 * 
 * Curl equivalents are provided in comments for each request.
 */

const API_BASE = process.env.API_URL || 'http://localhost:5000/api';
const JWT_TOKEN = process.env.JWT_TOKEN || '';

/**
 * Helper: Make authenticated request
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(JWT_TOKEN && { Authorization: `Bearer ${JWT_TOKEN}` }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${JSON.stringify(data)}`);
    }
    return data;
  }

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${response.statusText}`);
  }

  return response;
}

/**
 * Demo 1: Text-to-Image Generation
 * 
 * Curl:
 * curl -X POST $API_URL/gen/text2img \
 *   -H "Authorization: Bearer $JWT_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"prompt":"Streetwear look with denim jacket, fall palette","style":"photorealistic","width":1024,"height":1024}'
 */
async function demoText2Img() {
  console.log('\n=== Demo 1: Text-to-Image Generation ===\n');
  
  const request = {
    prompt: 'Streetwear look with denim jacket, fall palette',
    style: 'photorealistic',
    width: 1024,
    height: 1024,
  };

  console.log('Request:', JSON.stringify(request, null, 2));
  console.log('\nCurl equivalent:');
  console.log(`curl -X POST ${API_BASE}/gen/text2img \\
  -H "Authorization: Bearer <JWT_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(request)}'`);

  try {
    const result = await apiRequest('/gen/text2img', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    
    console.log('\nResponse:', JSON.stringify(result, null, 2));
    
    // Poll for job completion
    if (result.jobId) {
      console.log(`\nPolling for job ${result.jobId}...`);
      await pollJob(result.jobId);
    }
    
    return result;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

/**
 * Demo 2: Image Edit
 * 
 * Curl:
 * curl -X POST $API_URL/gen/edit \
 *   -H "Authorization: Bearer $JWT_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"imageKey":"uploads/user/image.png","prompt":"Add a blue scarf","style":"photorealistic"}'
 */
async function demoImageEdit() {
  console.log('\n=== Demo 2: Image Edit ===\n');
  
  const request = {
    imageKey: 'uploads/user/sample-image.png',
    prompt: 'Add a blue scarf to the outfit',
    style: 'photorealistic',
  };

  console.log('Request:', JSON.stringify(request, null, 2));
  console.log('\nCurl equivalent:');
  console.log(`curl -X POST ${API_BASE}/gen/edit \\
  -H "Authorization: Bearer <JWT_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(request)}'`);

  try {
    const result = await apiRequest('/gen/edit', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    
    console.log('\nResponse:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

/**
 * Demo 3: Virtual Try-On
 * 
 * Curl:
 * curl -X POST $API_URL/gen/tryon \
 *   -H "Authorization: Bearer $JWT_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"personImageKey":"uploads/user/photo.jpg","itemImageKey":"uploads/items/jacket.png","category":"top","fit":"standard"}'
 */
async function demoTryOn() {
  console.log('\n=== Demo 3: Virtual Try-On ===\n');
  
  const request = {
    personImageKey: 'uploads/user/photo.jpg',
    itemImageKey: 'uploads/items/jacket.png',
    category: 'top',
    fit: 'standard',
  };

  console.log('Request:', JSON.stringify(request, null, 2));
  console.log('\nCurl equivalent:');
  console.log(`curl -X POST ${API_BASE}/gen/tryon \\
  -H "Authorization: Bearer <JWT_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(request)}'`);

  try {
    const result = await apiRequest('/gen/tryon', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    
    console.log('\nResponse:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

/**
 * Demo 4: Batch Generation
 * 
 * Curl:
 * curl -X POST $API_URL/gen/batch \
 *   -H "Authorization: Bearer $JWT_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"jobs":[{"prompt":"Outfit 1","style":"casual"},{"prompt":"Outfit 2","style":"formal"}],"template":"lookbook"}'
 */
async function demoBatch() {
  console.log('\n=== Demo 4: Batch Generation ===\n');
  
  const request = {
    jobs: [
      { prompt: 'Casual streetwear outfit', style: 'streetwear' },
      { prompt: 'Formal business outfit', style: 'editorial' },
      { prompt: 'Weekend casual look', style: 'casual' },
    ],
    template: 'lookbook',
  };

  console.log('Request:', JSON.stringify(request, null, 2));
  console.log('\nCurl equivalent:');
  console.log(`curl -X POST ${API_BASE}/gen/batch \\
  -H "Authorization: Bearer <JWT_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(request)}'`);

  try {
    const result = await apiRequest('/gen/batch', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    
    console.log('\nResponse:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

/**
 * Demo 5: Get Job Status
 * 
 * Curl:
 * curl -X GET $API_URL/gen/job/{jobId} \
 *   -H "Authorization: Bearer $JWT_TOKEN"
 */
async function demoGetJobStatus(jobId) {
  console.log('\n=== Demo 5: Get Job Status ===\n');
  
  if (!jobId) {
    console.log('No jobId provided, skipping...');
    return null;
  }

  console.log(`Job ID: ${jobId}`);
  console.log('\nCurl equivalent:');
  console.log(`curl -X GET ${API_BASE}/gen/job/${jobId} \\
  -H "Authorization: Bearer <JWT_TOKEN>"`);

  try {
    const result = await apiRequest(`/gen/job/${jobId}`);
    console.log('\nResponse:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

/**
 * Demo 6: Admin Status (including credits)
 * 
 * Curl:
 * curl -X GET $API_URL/admin/status \
 *   -H "Authorization: Bearer <ADMIN_TOKEN>"
 */
async function demoAdminStatus() {
  console.log('\n=== Demo 6: Admin Status & Credits ===\n');
  
  console.log('Curl equivalent:');
  console.log(`curl -X GET ${API_BASE}/admin/status \\
  -H "Authorization: Bearer <ADMIN_TOKEN>"`);

  try {
    const result = await apiRequest('/admin/status');
    console.log('\nResponse:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

/**
 * Demo 7: List User's Jobs
 * 
 * Curl:
 * curl -X GET $API_URL/gen/jobs?status=completed&limit=10 \
 *   -H "Authorization: Bearer $JWT_TOKEN"
 */
async function demoListJobs() {
  console.log('\n=== Demo 7: List User Jobs ===\n');
  
  console.log('Curl equivalent:');
  console.log(`curl -X GET "${API_BASE}/gen/jobs?status=completed&limit=10" \\
  -H "Authorization: Bearer <JWT_TOKEN>"`);

  try {
    const result = await apiRequest('/gen/jobs?status=completed&limit=10');
    console.log('\nResponse:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

/**
 * Demo 8: Get Upload URL for direct S3 upload
 * 
 * Curl:
 * curl -X POST $API_URL/gen/upload-url \
 *   -H "Authorization: Bearer $JWT_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"filename":"my-photo.jpg","contentType":"image/jpeg","folder":"uploads"}'
 */
async function demoGetUploadUrl() {
  console.log('\n=== Demo 8: Get Upload URL ===\n');
  
  const request = {
    filename: 'my-photo.jpg',
    contentType: 'image/jpeg',
    folder: 'uploads',
  };

  console.log('Request:', JSON.stringify(request, null, 2));
  console.log('\nCurl equivalent:');
  console.log(`curl -X POST ${API_BASE}/gen/upload-url \\
  -H "Authorization: Bearer <JWT_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(request)}'`);

  try {
    const result = await apiRequest('/gen/upload-url', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    
    console.log('\nResponse:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

/**
 * Demo 9: Background Removal
 * 
 * Curl:
 * curl -X POST $API_URL/gen/remove-bg \
 *   -H "Authorization: Bearer $JWT_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"imageKey":"uploads/items/product.png"}'
 */
async function demoBackgroundRemoval() {
  console.log('\n=== Demo 9: Background Removal ===\n');
  
  const request = {
    imageKey: 'uploads/items/product.png',
  };

  console.log('Request:', JSON.stringify(request, null, 2));
  console.log('\nCurl equivalent:');
  console.log(`curl -X POST ${API_BASE}/gen/remove-bg \\
  -H "Authorization: Bearer <JWT_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(request)}'`);

  try {
    const result = await apiRequest('/gen/remove-bg', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    
    console.log('\nResponse:', JSON.stringify(result, null, 2));
    
    if (result.jobId) {
      console.log(`\nPolling for job ${result.jobId}...`);
      await pollJob(result.jobId);
    }
    
    return result;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

/**
 * Demo 10: PBR Texture Generation
 * 
 * Curl:
 * curl -X POST $API_URL/gen/pbr \
 *   -H "Authorization: Bearer $JWT_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"productImageKey":"uploads/items/fabric.png","maps":["albedo","normal","roughness"],"prompt":"wool tweed fabric"}'
 */
async function demoPBR() {
  console.log('\n=== Demo 10: PBR Texture Generation ===\n');
  
  const request = {
    productImageKey: 'uploads/items/fabric.png',
    maps: ['albedo', 'normal', 'roughness'],
    prompt: 'wool tweed fabric',
    resolution: 2048,
  };

  console.log('Request:', JSON.stringify(request, null, 2));
  console.log('\nCurl equivalent:');
  console.log(`curl -X POST ${API_BASE}/gen/pbr \\
  -H "Authorization: Bearer <JWT_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(request)}'`);

  try {
    const result = await apiRequest('/gen/pbr', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    
    console.log('\nResponse:', JSON.stringify(result, null, 2));
    
    if (result.jobId) {
      console.log(`\nPolling for job ${result.jobId}...`);
      await pollJob(result.jobId);
    }
    
    return result;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

/**
 * Demo 11: Attribute Extraction
 * 
 * Curl:
 * curl -X POST $API_URL/gen/attributes \
 *   -H "Authorization: Bearer $JWT_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"imageKey":"uploads/items/jacket.png"}'
 */
async function demoAttributes() {
  console.log('\n=== Demo 11: Attribute Extraction ===\n');
  
  const request = {
    imageKey: 'uploads/items/jacket.png',
  };

  console.log('Request:', JSON.stringify(request, null, 2));
  console.log('\nCurl equivalent:');
  console.log(`curl -X POST ${API_BASE}/gen/attributes \\
  -H "Authorization: Bearer <JWT_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(request)}'`);

  try {
    const result = await apiRequest('/gen/attributes', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    
    console.log('\nResponse:', JSON.stringify(result, null, 2));
    
    if (result.jobId) {
      console.log(`\nPolling for job ${result.jobId}...`);
      await pollJob(result.jobId);
    }
    
    return result;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

/**
 * Demo 12: Depth Map Generation (for AR)
 * 
 * Curl:
 * curl -X POST $API_URL/gen/depth-map \
 *   -H "Authorization: Bearer $JWT_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"imageKey":"uploads/items/dress.png"}'
 */
async function demoDepthMap() {
  console.log('\n=== Demo 12: Depth Map Generation ===\n');
  
  const request = {
    imageKey: 'uploads/items/dress.png',
  };

  console.log('Request:', JSON.stringify(request, null, 2));
  console.log('\nCurl equivalent:');
  console.log(`curl -X POST ${API_BASE}/gen/depth-map \\
  -H "Authorization: Bearer <JWT_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(request)}'`);

  try {
    const result = await apiRequest('/gen/depth-map', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    
    console.log('\nResponse:', JSON.stringify(result, null, 2));
    
    if (result.jobId) {
      console.log(`\nPolling for job ${result.jobId}...`);
      await pollJob(result.jobId);
    }
    
    return result;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

/**
 * Demo 13: Person Segmentation
 * 
 * Curl:
 * curl -X POST $API_URL/gen/segmentation \
 *   -H "Authorization: Bearer $JWT_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"imageKey":"uploads/user/photo.jpg"}'
 */
async function demoSegmentation() {
  console.log('\n=== Demo 13: Person Segmentation ===\n');
  
  const request = {
    imageKey: 'uploads/user/photo.jpg',
  };

  console.log('Request:', JSON.stringify(request, null, 2));
  console.log('\nCurl equivalent:');
  console.log(`curl -X POST ${API_BASE}/gen/segmentation \\
  -H "Authorization: Bearer <JWT_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(request)}'`);

  try {
    const result = await apiRequest('/gen/segmentation', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    
    console.log('\nResponse:', JSON.stringify(result, null, 2));
    
    if (result.jobId) {
      console.log(`\nPolling for job ${result.jobId}...`);
      await pollJob(result.jobId);
    }
    
    return result;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

/**
 * Demo 14: Queue Status (Admin)
 * 
 * Curl:
 * curl -X GET $API_URL/admin/queue-stats \
 *   -H "Authorization: Bearer <ADMIN_TOKEN>"
 */
async function demoQueueStats() {
  console.log('\n=== Demo 14: Queue Stats ===\n');
  
  console.log('Curl equivalent:');
  console.log(`curl -X GET ${API_BASE}/admin/queue-stats \\
  -H "Authorization: Bearer <ADMIN_TOKEN>"`);

  try {
    const result = await apiRequest('/admin/queue-stats');
    console.log('\nResponse:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

/**
 * Poll job until completion
 */
async function pollJob(jobId, maxAttempts = 60, interval = 2000) {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const status = await apiRequest(`/gen/job/${jobId}`);
      console.log(`  Status: ${status.status}`);
      
      if (status.status === 'completed') {
        console.log('\nJob completed!');
        if (status.resultUrl) {
          console.log(`Result URL: ${status.resultUrl}`);
        }
        return status;
      }
      
      if (status.status === 'failed') {
        console.log('\nJob failed:', status.errorMessage);
        return status;
      }
      
      attempts++;
      await new Promise(r => setTimeout(r, interval));
    } catch (error) {
      console.error('Polling error:', error.message);
      break;
    }
  }
  
  console.log('Polling timeout');
  return null;
}

/**
 * Main runner
 */
async function main() {
  const args = process.argv.slice(2);
  const demo = args[0];
  
  console.log('========================================');
  console.log('ClosetAI Generation API Test Script');
  console.log('========================================');
  console.log(`API Base: ${API_BASE}`);
  console.log(`JWT Token: ${JWT_TOKEN ? '***' : '(not set)'}`);
  
  if (!demo || demo === 'all') {
    await demoText2Img();
    await demoImageEdit();
    await demoTryOn();
    await demoBatch();
    await demoListJobs();
    await demoGetUploadUrl();
    await demoBackgroundRemoval();
    await demoPBR();
    await demoAttributes();
    await demoDepthMap();
    await demoSegmentation();
    await demoAdminStatus();
  } else {
    switch (demo) {
      case 'text2img':
        await demoText2Img();
        break;
      case 'edit':
        await demoImageEdit();
        break;
      case 'tryon':
        await demoTryOn();
        break;
      case 'batch':
        await demoBatch();
        break;
      case 'jobs':
        await demoListJobs();
        break;
      case 'upload':
        await demoGetUploadUrl();
        break;
      case 'remove-bg':
        await demoBackgroundRemoval();
        break;
      case 'pbr':
        await demoPBR();
        break;
      case 'attributes':
        await demoAttributes();
        break;
      case 'depth-map':
        await demoDepthMap();
        break;
      case 'segmentation':
        await demoSegmentation();
        break;
      case 'queue':
        await demoQueueStats();
        break;
      case 'admin':
        await demoAdminStatus();
        break;
      default:
        console.log(`Unknown demo: ${demo}`);
        console.log('Available demos: text2img, edit, tryon, batch, jobs, upload, remove-bg, pbr, attributes, depth-map, segmentation, queue, admin');
    }
  }
  
  console.log('\n========================================');
  console.log('Done!');
  console.log('========================================\n');
}

main().catch(console.error);
