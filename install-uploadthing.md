# UploadThing Installation Guide

## 1. Install Required Packages

```bash
npm install uploadthing @uploadthing/react
```

## 2. Environment Variables

Add these to your `.env.local`:

```env
UPLOADTHING_SECRET=your_uploadthing_secret_key
UPLOADTHING_APP_ID=your_uploadthing_app_id
```

Get these from: https://uploadthing.com/dashboard

## 3. What's Been Set Up

### API Routes
- `/api/uploadthing/core.ts` - File router configuration
- `/api/uploadthing/route.ts` - API route handler

### Components
- `UploadThingUpload` - Reusable upload component
- `PersonnelPhotoUploadNew` - Updated personnel photo upload

### Utilities
- `fileStorageNew.ts` - New file storage utilities
- `uploadthing.ts` - UploadThing client setup

### File Types Supported
- **Personnel Photos**: Images up to 4MB
- **Case Evidence**: Images, PDFs, Videos up to 64MB
- **Documents**: PDFs, DOCs, TXT up to 16MB
- **Reports**: PDFs, CSV, Excel up to 32MB

## 4. Benefits Over Firebase Storage

✅ **Simpler Setup** - No complex bucket configuration
✅ **Built for Next.js** - Optimized for React/Next.js apps
✅ **Automatic CDN** - Global file delivery
✅ **Type Safety** - Full TypeScript support
✅ **File Processing** - Automatic image optimization
✅ **Better DX** - Easier debugging and monitoring
✅ **Cost Effective** - Generous free tier

## 5. Migration Steps

1. Install packages: `npm install uploadthing @uploadthing/react`
2. Add environment variables
3. Replace old upload components with new ones
4. Update file references to use UploadThing URLs
5. Test uploads in development

## 6. Usage Example

```tsx
import { UploadThingUpload } from "@/components/ui/uploadthing-upload";

<UploadThingUpload
  endpoint="personnelPhotos"
  onUploadComplete={(files) => console.log("Uploaded:", files)}
  onUploadError={(error) => console.error("Error:", error)}
  maxFiles={1}
  accept="image/*"
/>
```

## 7. File Storage Endpoints

- `personnelPhotos` - Personnel profile photos
- `userProfiles` - User profile photos  
- `caseEvidence` - Case investigation files
- `documents` - General documents
- `reports` - Reports and exports
