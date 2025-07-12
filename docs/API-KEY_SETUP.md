# API Key Authentication

## Overview
All API requests must include an API key in the headers.

## Required Header
```
x-api-key: your_api_key_here
```

## Backend Setup

### 1. Environment Variables
Add to your `.env` file:
```env
API_KEY=your_generated_api_key_here
```

### 2. Generate API Key
```bash
(generated using = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" or node -e "console.log(require('crypto').randomUUID())")
```

### 3. Frontend Configuration
Add to your frontend `.env`:
```env
NEXT_PUBLIC_API_KEY=your_generated_api_key_here
```

## Usage Examples

### cURL
```bash
curl --location 'http://localhost:3000/auth/login' \
--header 'Content-Type: application/json' \
--header 'x-api-key: your_api_key_here' \
--data '{
  "email": "user@example.com",
  "password": "password123"
}'
```

### JavaScript/Axios
```javascript
const response = await axios.post('/auth/login', {
  email: 'user@example.com',
  password: 'password123'
}, {
  headers: {
    'x-api-key': process.env.NEXT_PUBLIC_API_KEY
  }
});
```

### Fetch API
```javascript
fetch('/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.NEXT_PUBLIC_API_KEY
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});
```

## Error Responses

### Missing API Key
```json
{
  "message": "API key is missing",
  "statusCode": 401
}
```

### Invalid API Key
```json
{
  "message": "Invalid API key",
  "statusCode": 401
}
```

## Important Notes

- ⚠️ **Never commit API keys to version control**
- 🔄 **Restart your server after adding environment variables**
- 📝 **All endpoints require the API key header**
- 🔒 **Use different API keys for different environments (dev, staging, prod)**

## Testing

Test with valid API key:
```bash
# Should work
curl -H "x-api-key: your_key" http://localhost:3000/auth/login
```

Test without API key:
```bash
# Should return 401
curl http://localhost:3000/auth/login
```
