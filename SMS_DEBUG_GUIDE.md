# SMS Debugging Guide for MADPC

## Issues Fixed

### 1. **API Credentials Configuration**
- **Problem**: Hardcoded API credentials in source code
- **Fix**: Updated to use environment variables
- **Action Required**: Ensure your `.env.local` file contains:
```bash
UELLOSEND_API_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJkYXRhIjp7InVzZXJpZCI6MjE1MywiYXBpU2VjcmV0IjoiUHdaU2FjeHUyQVBpWnl5IiwiaXNzdWVyIjoiVUVMTE9TRU5EIn19
UELLOSEND_API_SECRET=PwZSacxu2APiZyy
UELLOSEND_SENDER_ID=MADPC
```

### 2. **JWT Token Format**
- **Problem**: Invalid JWT token with extra `=` character
- **Fix**: Corrected JWT token format in env.example
- **Note**: The JWT token should not have `=` after the first dot

### 3. **Error Handling**
- **Problem**: Poor error handling and logging
- **Fix**: Added comprehensive error handling with:
  - API response validation
  - Network error detection
  - Detailed error messages
  - Console logging for debugging

### 4. **API Response Validation**
- **Problem**: No validation of UelloSend API responses
- **Fix**: Added checks for API error responses
- **Note**: UelloSend may return 200 status but with error in response body

## Testing SMS Functionality

### 1. **Check Environment Variables**
```bash
# In your terminal, verify env vars are loaded:
echo $UELLOSEND_API_KEY
echo $UELLOSEND_API_SECRET
echo $UELLOSEND_SENDER_ID
```

### 2. **Test Single SMS**
Use the API endpoint: `POST /api/notifications/sms`
```json
{
  "phone": "0241234567",
  "message": "Test message from MADPC"
}
```

### 3. **Test via Personnel Notifications**
Use: `POST /api/notifications/personnel`
```json
{
  "personnelIds": ["personnel_id"],
  "subject": "Test Alert",
  "message": "This is a test SMS",
  "channels": ["sms"]
}
```

## Common Issues & Solutions

### Issue: "UelloSend API credentials not configured"
- **Cause**: Missing environment variables
- **Solution**: Add UELLOSEND_* variables to your `.env.local` file

### Issue: "Invalid phone number format"
- **Cause**: Phone number doesn't match Ghana format
- **Solution**: Ensure numbers are in format: 233XXXXXXXXX (12 digits)

### Issue: "Network error: Unable to reach SMS service"
- **Cause**: Network connectivity or UelloSend service down
- **Solution**: Check internet connection and UelloSend service status

### Issue: "API Error: 401 - Unauthorized"
- **Cause**: Invalid API credentials
- **Solution**: Verify your UelloSend API key and secret are correct

## Phone Number Validation

The system validates Ghana phone numbers:
- **Format**: 233XXXXXXXXX (12 digits total)
- **Examples**: 
  - `0241234567` → `233241234567`
  - `+233241234567` → `233241234567`
  - `233241234567` → `233241234567`

## Monitoring SMS Status

Check the browser console and server logs for:
- `[SMS] Sending to...` - SMS attempt started
- `[SMS] UelloSend response:` - API response received
- `[SMS] Send failed:` - Error occurred

## Next Steps

1. **Verify Environment Variables**: Ensure all UELLOSEND_* variables are set
2. **Test with Valid Phone Number**: Use a Ghana mobile number
3. **Check UelloSend Account**: Verify your account has sufficient credits
4. **Monitor Logs**: Watch console/server logs for detailed error messages
