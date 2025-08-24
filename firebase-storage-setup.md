# Firebase Storage Setup Guide

This guide will help you set up Firebase Storage for the MADPC application to replace UploadThing.

## Prerequisites

1. Firebase project (you already have `manso-adubia`)
2. Firebase Storage enabled in your project

## Step 1: Enable Firebase Storage

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`manso-adubia`)
3. Navigate to **Storage** in the left sidebar
4. Click **Get Started**
5. Choose your security rules (start in test mode for development)
6. Select a location for your storage bucket
7. Your storage bucket will be: `manso-adubia.firebasestorage.app`

## Step 2: Create a Service Account for Admin SDK

1. In the Firebase Console, go to **Project Settings** (gear icon)
2. Navigate to the **Service Accounts** tab
3. Click **Generate new private key**
4. Download the JSON file (keep it secure!)
5. This file contains your Firebase Admin SDK credentials

Alternatively, you can create a service account in Google Cloud Console:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (`manso-adubia`)
3. Go to **IAM & Admin** > **Service Accounts**
4. Click **Create Service Account**
5. Fill in the details:
   - **Name**: `firebase-storage-admin`
   - **Description**: `Service account for MADPC Firebase Storage`
6. Grant the **Firebase Admin SDK Administrator Service Agent** role
7. Generate and download the JSON key

## Step 3: Configure Environment Variables

Update your `.env.local` file with the following variables:

```env
# Firebase Storage config
FIREBASE_STORAGE_BUCKET=manso-adubia.firebasestorage.app
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@manso-adubia.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
NEXT_PUBLIC_FIREBASE_STORAGE_BASE_URL=https://firebasestorage.googleapis.com/v0/b/manso-adubia.firebasestorage.app/o
```

### Getting the Credentials

From your downloaded JSON key file, copy:
- `private_key` → `FIREBASE_PRIVATE_KEY`
- `client_email` → `FIREBASE_CLIENT_EMAIL`

**Important**: Replace `\n` in the private key with actual newlines or keep them as `\n` (the code handles both).

## Step 4: Configure Firebase Storage Rules

For public file access, you can make the bucket publicly readable:

1. Go to your bucket in the Cloud Console
2. Click on the **Permissions** tab
3. Click **Grant Access**
4. Add principal: `allUsers`
5. Assign role: **Storage Object Viewer**

**Note**: This makes all files in the bucket publicly accessible. For more security, use signed URLs.

## Step 6: Configure CORS (if needed)

If you need to access files from the browser directly:

1. Go to your bucket
2. Click on the **Configuration** tab
3. Add CORS configuration:

```json
[
  {
    "origin": ["https://your-domain.com", "http://localhost:3000"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

## Folder Structure

The application will create the following folder structure in your bucket:

```
madpc-storage/
├── personnel/
│   └── photos/
│       └── {personnel-id}/
├── users/
│   └── profiles/
│       └── {user-id}/
├── cases/
│   └── evidence/
├── documents/
└── reports/
```

## Security Best Practices

1. **Service Account**: Use a dedicated service account with minimal required permissions
2. **Environment Variables**: Never commit your private key to version control
3. **Bucket Access**: Consider using signed URLs for sensitive files instead of public access
4. **File Validation**: The application validates file types and sizes before upload
5. **Cleanup**: Old files are automatically deleted when new ones are uploaded

## Cost Optimization

1. **Lifecycle Rules**: Set up lifecycle rules to delete old files or move them to cheaper storage classes
2. **Regional Storage**: Use regional storage for better performance and lower costs
3. **Monitoring**: Set up billing alerts to monitor storage costs

## Troubleshooting

### Common Issues

1. **Authentication Error**: Check that your service account key is correctly formatted
2. **Permission Denied**: Ensure your service account has the required roles
3. **Bucket Not Found**: Verify the bucket name and that it exists
4. **CORS Issues**: Configure CORS if accessing files directly from the browser

### Testing the Setup

You can test the upload functionality by:
1. Going to the Personnel page
2. Adding a new personnel member
3. Uploading a photo
4. Checking that the file appears in your Google Cloud Storage bucket

## Migration from UploadThing

The migration is complete! The application now:

1. ✅ Uses Google Cloud Storage instead of UploadThing
2. ✅ Maintains the same upload functionality
3. ✅ Automatically deletes old files when new ones are uploaded
4. ✅ Supports all file types (images, documents, videos)
5. ✅ Provides better cost control and scalability

All existing functionality remains the same from the user's perspective.
