# YouCam Fashion Mock Data Documentation

## Overview

This document describes the mock data and API simulation framework for YouCam / PerfectCorp Fashion AI API virtual try-on endpoints. The mock data enables demo flows without real API keys and provides controlled contingencies for error handling.

## Supported Features

### Virtual Try-On Endpoints

1. **AI Clothes Try-On** - Supports garment categories: `full_body`, `upper_body`, `lower_body`, `shoes`, `auto`
2. **AI Scarf Try-On** - Optional style presets available
3. **AI Shoes Try-On** - Style presets supported
4. **Accessory Try-On** - Jewelry, watches, and other accessories

## File Structure

```
mock/
  youcam-fashion/
    clothes_tryon_request.json      # Sample clothes try-on request
    clothes_tryon_response_success.json  # Success response fixture
    clothes_tryon_response_error.json    # Error response fixture
    scarf_tryon_request.json         # Scarf try-on request
    scarf_tryon_response_success.json  # Scarf success response
    scarf_tryon_response_error.json     # Scarf error response
    shoes_tryon_request.json         # Shoes try-on request
    shoes_tryon_response_success.json   # Shoes success response
    shoes_tryon_response_error.json    # Shoes error response
    accessory_tryon_request.json    # Accessory try-on request
    accessory_tryon_response_success.json  # Accessory success
    accessory_tryon_response_error.json     # Accessory error
    schemas.js                       # JSON schema definitions

backend/
  routes/
    youcam-mock.js                  # Mock API router

src/
  services/
    youcamFashionMock.ts            # Frontend mock service
```

## API Endpoints

### Mock Endpoints (Backend)

All mock endpoints are available under `/api/mock/youcam/`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/mock/youcam/clothes-tryon` | POST | AI Clothes Try-On |
| `/mock/youcam/scarf-tryon` | POST | AI Scarf Try-On |
| `/mock/youcam/shoes-tryon` | POST | AI Shoes Try-On |
| `/mock/youcam/accessory-tryon` | POST | Accessory Try-On |
| `/mock/youcam/status/:taskId` | GET | Poll task status |
| `/mock/youcam/constants` | GET | Get supported constants |

### Query Parameters

For testing error scenarios, use query parameters:

| Parameter | Values | Description |
|-----------|--------|-------------|
| `errorMode` | `true` | Force error response |
| `errorCode` | See Error Codes | Return specific error |
| `status` | `processing`, `success`, `failed` | Force task status (for polling) |

### Example: Force Error Response

```bash
curl -X POST "http://localhost:3000/api/mock/youcam/clothes-tryon?errorMode=true&errorCode=error_no_face" \
  -H "Content-Type: application/json" \
  -d '{
    "src_file_url": "/placeholders/selfie.jpg",
    "ref_file_url": "/placeholders/outfit.jpg"
  }'
```

## Request Examples

### Clothes Try-On

```json
{
  "src_file_url": "/placeholders/selfie_demo.jpg",
  "ref_file_url": "/placeholders/outfit_reference.jpg",
  "garment_category": "auto",
  "change_shoes": true,
  "style": "style_urban_chic"
}
```

### Scarf Try-On

```json
{
  "src_file_url": "/placeholders/selfie_demo.jpg",
  "ref_file_url": "/placeholders/scarf_reference.jpg",
  "style": "style_bohemian"
}
```

### Shoes Try-On

```json
{
  "src_file_url": "/placeholders/selfie_demo.jpg",
  "ref_file_url": "/placeholders/shoes_reference.jpg",
  "style": "style_retro_fashion"
}
```

### Accessory Try-On

```json
{
  "src_file_url": "/placeholders/selfie_demo.jpg",
  "ref_file_url": "/placeholders/earrings_reference.jpg",
  "accessory_type": "earring",
  "style": "default"
}
```

## Response Examples

### Success Response

```json
{
  "status": 200,
  "data": {
    "task_id": "demo-clothes-tryon-001",
    "estimated_seconds": 2,
    "output": {
      "composite_url": "/placeholders/tryon_clothes_demo.png",
      "masks": {
        "upper_body": "/placeholders/mask_upper.png",
        "lower_body": "/placeholders/mask_lower.png",
        "shoes": "/placeholders/mask_shoes.png"
      },
      "style": "style_urban_chic",
      "garment_category": "auto"
    }
  }
}
```

### Error Response

```json
{
  "status": 400,
  "error": {
    "code": "invalid_parameter",
    "message": "The garment_category parameter is invalid.",
    "details": {
      "parameter": "garment_category",
      "expected_values": ["full_body", "upper_body", "lower_body", "auto", "shoes"]
    }
  }
}
```

## Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `invalid_parameter` | 400 | Request parameters are invalid |
| `error_no_face` | 400 | No face detected in source image |
| `error_invalid_ref` | 400 | Reference image has invalid content |
| `error_apply_region_mismatch` | 400 | Images don't align for placement |
| `error_file_size_exceeded` | 400 | File exceeds 10MB limit |
| `error_unsupported_format` | 400 | Unsupported file format |
| `error_processing_failed` | 500 | Task processing failed |
| `error_timeout` | 408 | Request timed out |

## Supported Constants

### Garment Categories

- `full_body` - Full body outfit
- `upper_body` - Tops, shirts, jackets
- `lower_body` - Pants, skirts
- `shoes` - Shoes only
- `auto` - Automatic detection

### Scarf Styles

- `style_french_elegance`
- `style_light_luxury`
- `style_cottagecore`
- `style_modern_chic`
- `style_bohemian`

### Shoes Styles

- `style_minimalist`
- `style_bohemian`
- `style_cottagecore`
- `style_french_elegance`
- `style_retro_fashion`

### Accessory Types

- `earring`
- `bracelet`
- `ring`
- `necklace`
- `watch`

## File Requirements

| Requirement | Value |
|-------------|-------|
| Max File Size | 10MB |
| Supported Formats | JPG, JPEG, PNG, WEBP |
| Min Dimensions | 256 x 256 pixels |
| Max Dimensions | 4096 x 4096 pixels |

## Frontend Integration

### Using the Mock Service

```typescript
import { 
  tryonClothes, 
  tryonScarf, 
  tryonScarf,
  tryonAccessory,
  configureYouCamMockService,
  YC_FASHION_CONSTANTS 
} from '@/services/youcamFashionMock';

// Configure mock mode (default)
configureYouCamMockService({
  useMock: true,
  mockDelay: 500
});

// Try on clothes
const result = await tryonClothes({
  src_file_url: '/placeholders/selfie.jpg',
  ref_file_url: '/placeholders/outfit.jpg',
  garment_category: 'auto'
});

if (result.status === 200) {
  console.log('Try-on successful:', result.data.output.composite_url);
} else {
  console.error('Error:', result.error.message);
}
```

### Switching to Real API

```typescript
// Configure for real API
configureYouCamMockService({
  useMock: false,
  baseUrl: 'https://api.perfectcorp.com'
});
```

## Visual Mock Data Notes

### Placeholder Images

The mock data uses placeholder images located at `/placeholders/`:

| Placeholder | Description |
|-------------|--------------|
| `/placeholders/selfie_demo.jpg` | Demo user selfie |
| `/placeholders/outfit_reference.jpg` | Demo outfit reference |
| `/placeholders/scarf_reference.jpg` | Demo scarf reference |
| `/placeholders/shoes_reference.jpg` | Demo shoes reference |
| `/placeholders/earrings_reference.jpg` | Demo accessory reference |
| `/placeholders/tryon_clothes_demo.png` | Demo clothes try-on result |
| `/placeholders/tryon_scarf_demo.png` | Demo scarf try-on result |
| `/placeholders/tryon_shoes_demo.png` | Demo shoes try-on result |
| `/placeholders/tryon_earrings_demo.png` | Demo accessory try-on result |

### UI Testing Notes

- For **scarf try-on**: Overlay the scarf at neck area
- For **shoes try-on**: Show cropped lower-body composite
- For **accessory try-on**: Show zoomed accessory overlay
- For **clothes try-on**: Display full-body or segmented results based on `garment_category`

## Migration to Real YouCam API

### Steps to Switch to Production

1. **Obtain API Credentials**
   - Sign up at PerfectCorp Developer Portal
   - Get `PERFECT_API_KEY` and `PERFECT_API_BASE`

2. **Configure Environment Variables**
   ```bash
   # Add to backend/.env
   PERFECT_API_BASE=https://api.perfectcorp.com
   PERFECT_API_KEY=your_api_key_here
   ```

3. **Update Backend Client**
   
   Replace mock router with real API calls in `backend/lib/perfectCorpClient.js`:

   ```javascript
   // Real API implementation
   async function createClothTryonTask(srcFileUrl, refFileUrl, options) {
     // 1. Upload source file
     const srcUpload = await this.uploadFile(srcFileUrl, 'source');
     
     // 2. Upload reference file
     const refUpload = await this.uploadFile(refFileUrl, 'reference');
     
     // 3. Create task
     const task = await this.client.post('/s2s/v2.0/task/cloth', {
       src_file_id: srcUpload.file_id,
       ref_file_id: refUpload.file_id,
       garment_category: options.garment_category || 'auto',
       ...options
     });
     
     return task;
   }
   ```

4. **Implement Polling**
   
   Real YouCam API uses async task processing:
   - Submit task → get `task_id`
   - Poll `/s2s/v2.0/task/{task_id}` until `task_status === 'success'`
   - Handle errors appropriately

5. **Update Frontend**
   
   Disable mock mode:
   ```typescript
   configureYouCamMockService({ useMock: false });
   ```

### Real API Endpoints (Reference)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/s2s/v2.0/file/upload` | POST | Upload image file |
| `/s2s/v2.0/task/cloth` | POST | Create clothes try-on task |
| `/s2s/v2.0/task/scarf` | POST | Create scarf try-on task |
| `/s2s/v2.0/task/shoes` | POST | Create shoes try-on task |
| `/s2s/v2.0/task/accessory` | POST | Create accessory try-on task |
| `/s2s/v2.0/task/{task_id}` | GET | Get task status |

## Testing

### Backend Tests

Run mock API tests:

```bash
cd backend
npm test -- --testPathPattern=youcam-mock
```

### Frontend Tests

Run frontend mock service tests:

```bash
npm test -- --testPathPattern=youcamFashionMock
```

### Example Test Scenarios

See [`mock/youcam-fashion/test-scenarios.js`](./mock/youcam-fashion/test-scenarios.js) for detailed test cases.

## Notes

- Mock data follows the official PerfectCorp YouCam API structure
- All mock responses include realistic `task_id` values with timestamps
- Error simulation helps test error handling in UI
- The mock server validates request parameters like the real API
- File size and format validation is performed server-side

## References

- [PerfectCorp Developer Portal](https://docs.perfectcorp.com/)
- [YouCam API Documentation](https://docs.perfectcorp.com/fashion-api)
