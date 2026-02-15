# ClosetAI Backend – Error Handling

Comprehensive error handling for the ClosetAI backend: custom error classes, async wrapper, global error middleware, Winston logging, and process-level handlers.

---

## Structure

```
backend/
├── utils/
│   ├── errors.js           # Custom error classes
│   ├── asyncHandler.js     # Wrapper to catch async errors
│   └── logger.js           # Winston logger (file + console)
├── middleware/
│   └── error.middleware.js # Global error handler
├── logs/                   # Winston log files (gitignored)
│   ├── error.log
│   └── combined.log
└── server.js               # Process handlers & 404
```

---

## 1. Custom Error Classes (`utils/errors.js`)

| Class | Status | Use Case |
|-------|--------|----------|
| `BadRequestError` | 400 | Invalid input, malformed request |
| `UnauthorizedError` | 401 | Missing/invalid auth |
| `ForbiddenError` | 403 | No permission |
| `NotFoundError` | 404 | Resource not found |
| `ConflictError` | 409 | Duplicate, version conflict |
| `ValidationError` | 422 | Schema/validation failure |
| `RateLimitError` | 429 | Too many requests |
| `InternalServerError` | 500 | Unexpected server error |

**Usage:**
```javascript
const { NotFoundError, BadRequestError } = require('../utils/errors');

throw new NotFoundError('User not found');
throw new BadRequestError('Invalid input', { field: 'email' });
```

---

## 2. Async Handler (`utils/asyncHandler.js`)

Wraps async route handlers so errors are passed to `next()` automatically.

```javascript
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError } = require('../utils/errors');

exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new NotFoundError('User not found');
  res.json(user);
});
```

---

## 3. Winston Logger (`utils/logger.js`)

- **Production:** JSON to `logs/error.log` and `logs/combined.log`
- **Development:** Same files + colored console output
- Auto-creates `logs/` directory

---

## 4. Global Error Middleware (`middleware/error.middleware.js`)

Handles:

- **AppError** – Uses `statusCode`, `message`, `details`
- **Sequelize** – Validation/unique constraint → 422
- **JWT** – Invalid/expired token → 401
- **Multer** – File size/unexpected field → 400
- **Axios** – External API errors → 502 (or response status)
- **Unknown** – 500; in production, hides stack/details

Response format:
```json
{
  "success": false,
  "error": {
    "message": "Resource not found",
    "details": null
  }
}
```

---

## 5. 404 Handler

Unmatched routes return:
```json
{
  "success": false,
  "error": {
    "message": "Cannot GET /api/nonexistent"
  }
}
```

---

## 6. Process-Level Handlers

Registered at startup in `server.js`:

- **uncaughtException** – Logs and exits
- **unhandledRejection** – Logs and exits

---

## 7. Testing

### 404
```bash
curl http://localhost:5000/api/nonexistent
```

### Bad Request (trends search)
```bash
curl "http://localhost:5000/api/trends/search"
# 400: "Search query (q) required"
```

### Validation (trend-aware outfits)
```bash
curl -X POST http://localhost:5000/api/trends/outfits/trend-aware \
  -H "Content-Type: application/json" \
  -d '{}'
# 400: "wardrobe array is required"
```

---

## Summary

- Custom error classes for consistent status codes
- `asyncHandler` to remove try/catch in controllers
- Winston logging to files and console
- Central error middleware for all error types
- Process handlers for uncaught errors
- Uniform JSON error responses
