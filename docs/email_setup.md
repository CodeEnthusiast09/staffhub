# Email Service Setup

## Overview
Configure email service for sending emails (user registration, password reset, notifications, etc.)

## Environment Variables
Add to your `.env` file:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com
```

## Gmail Setup (Recommended)

### 1. Enable 2-Factor Authentication
- Go to [Google Account Settings](https://myaccount.google.com/security)
- Enable 2-Step Verification

### 2. Generate App Password
- Go to [App Passwords](https://myaccount.google.com/apppasswords)
- Select "Mail" and your device
- Copy the generated 16-character password
- Use this password in `EMAIL_PASS` (not your regular Gmail password)

### 3. Configuration
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop  # 16-character app password
EMAIL_FROM=your_email@gmail.com
```

## Other Email Providers

### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your_email@outlook.com
EMAIL_PASS=your_password
```

### Yahoo
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your_email@yahoo.com
EMAIL_PASS=your_app_password
```

### Custom SMTP
```env
EMAIL_HOST=mail.yourdomain.com
EMAIL_PORT=587
EMAIL_USER=your_email@yourdomain.com
EMAIL_PASS=your_password
```

## Usage Example

### Send Email Endpoint
```bash
curl --location 'http://localhost:3000/email/send-email' \
--header 'Content-Type: application/json' \
--header 'x-api-key: your_api_key' \
--data '{
  "recipients": ["user@example.com"],
  "subject": "Test Email",
  "html": "<h1>Hello World</h1><p>This is a test email.</p>",
  "text": "Hello World. This is a test email."
}'
```

### JavaScript/Frontend
```javascript
const sendEmail = async () => {
  const response = await fetch('/email/send-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.NEXT_PUBLIC_API_KEY
    },
    body: JSON.stringify({
      recipients: ['user@example.com'],
      subject: 'Welcome to StaffHub',
      html: '<h1>Welcome!</h1><p>Thank you for joining us.</p>',
      text: 'Welcome! Thank you for joining us.'
    })
  });
  
  const result = await response.json();
  console.log(result);
};
```

## Common Issues & Solutions

### ❌ "Connection timeout"
**Solution:** Check your EMAIL_HOST and EMAIL_PORT settings

### ❌ "Authentication failed"
**Solution:** 
- Use App Password instead of regular password for Gmail
- Make sure 2FA is enabled for Gmail
- Check EMAIL_USER and EMAIL_PASS are correct

### ❌ "Invalid login"
**Solution:**
- For Gmail: Enable "Less secure app access" OR use App Password
- For other providers: Check credentials

### ❌ "ECONNREFUSED"
**Solution:**
- Check if EMAIL_HOST is correct
- Verify EMAIL_PORT (587 for TLS, 465 for SSL)
- Check firewall settings

## Testing

### Test Email Configuration
```bash
# Test endpoint
curl --location 'http://localhost:3000/email/send-email' \
--header 'Content-Type: application/json' \
--header 'x-api-key: your_api_key' \
--data '{
  "recipients": ["your_test_email@gmail.com"],
  "subject": "Test Email Configuration",
  "html": "<p>If you receive this, email is working!</p>",
  "text": "If you receive this, email is working!"
}'
```

### Expected Response
```json
{
  "message": "Email sent successfully"
}
```

## Security Best Practices

- ✅ **Use App Passwords**: Never use your main email password
- ✅ **Environment Variables**: Keep credentials in .env files
- ✅ **Different Credentials**: Use different email accounts for dev/staging/prod
- ⚠️ **Never Commit**: Don't commit .env files to version control
- 🔒 **Rate Limiting**: Implement email rate limiting in production

## Development vs Production

### Development
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=dev.staffhub@gmail.com
EMAIL_PASS=dev_app_password
```

### Production
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@staffhub.com
EMAIL_PASS=prod_app_password
```

## Troubleshooting

### Check Server Logs
Look for error messages in your NestJS console:
```bash
npm run start:dev
```

### Test SMTP Connection
```javascript
// Add to your email service for testing
async testConnection() {
  try {
    await this.transporter.verify();
    console.log('✅ SMTP connection successful');
  } catch (error) {
    console.error('❌ SMTP connection failed:', error);
  }
}
```

## Email Templates

### Welcome Email
```html
<h1>Welcome to StaffHub!</h1>
<p>Thank you for joining our platform.</p>
<p>Click <a href="{{activation_link}}">here</a> to activate your account.</p>
```

### Password Reset
```html
<h1>Password Reset</h1>
<p>Click the link below to reset your password:</p>
<p><a href="{{reset_link}}">Reset Password</a></p>
<p>This link expires in 1 hour.</p>
```

## Important Notes

- 🔄 **Restart server** after changing email environment variables
- 📧 **Check spam folder** when testing
- ⏰ **App passwords** don't expire but can be revoked
- 🌐 **Use production email service** (SendGrid, AWS SES) for high volume
