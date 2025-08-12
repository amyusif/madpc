# Hybrid Storage Architecture: Firebase + UploadThing

This document explains the hybrid storage setup where Firebase handles personal data securely and UploadThing serves images fast via CDN.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Firebase      │    │   UploadThing   │
│   (React)       │    │   (Firestore)   │    │   (CDN)         │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • User uploads  │───▶│ • Personal data │    │ • Image files   │
│   image         │    │ • Image URLs    │◄───│ • Fast delivery │
│ • Form data     │───▶│ • Metadata      │    │ • Global CDN    │
│ • Display       │◄───│ • Security      │    │ • Optimized     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Benefits

### 🔒 Security
- **Firebase**: Handles sensitive personal data with enterprise-grade security
- **UploadThing**: Manages file uploads with built-in security and validation
- **Separation**: Personal data and files are stored separately for better security

### ⚡ Performance
- **UploadThing CDN**: Images load fast from global edge locations
- **Firebase**: Optimized for real-time data queries and updates
- **Caching**: CDN automatically caches images for faster subsequent loads

### 💰 Cost Efficiency
- **Firebase**: Pay for database operations, not file storage
- **UploadThing**: Optimized pricing for file storage and delivery
- **Bandwidth**: CDN reduces bandwidth costs

## Implementation

### 1. Personnel Creation Flow

```typescript
// 1. User selects image in Add Personnel modal
const handleImageUpload = (files: { url: string; name: string; size: number }[]) => {
  setSelectedImage(files[0].url); // UploadThing CDN URL
};

// 2. Form submission includes image URL
const personnelData = {
  badge_number: "P001",
  first_name: "John",
  last_name: "Doe",
  // ... other personal data
  photo_url: selectedImage, // UploadThing URL stored in Firebase
};

// 3. Save to Firebase/Supabase
await supabaseHelpers.createPersonnel(personnelData);
```

### 2. Data Retrieval Flow

```typescript
// 1. Fetch personnel data from Firebase
const personnel = await supabaseHelpers.getPersonnel();

// 2. Display with image from UploadThing CDN
<Avatar>
  <AvatarImage src={personnel.photo_url} /> {/* Fast CDN delivery */}
  <AvatarFallback>{personnel.first_name[0]}</AvatarFallback>
</Avatar>
```

### 3. Database Schema

```sql
-- Personnel table stores UploadThing URLs
CREATE TABLE personnel (
  id UUID PRIMARY KEY,
  badge_number TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  -- ... other personal fields
  photo_url TEXT, -- UploadThing CDN URL
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Configuration

### Environment Variables

```bash
# UploadThing Configuration
UPLOADTHING_SECRET=sk_live_your_secret_key
UPLOADTHING_APP_ID=your_app_id

# Firebase Configuration (if using Firestore)
NEXT_PUBLIC_USE_FIRESTORE=true
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
# ... other Firebase config

# Supabase Configuration (if using Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### UploadThing Endpoints

```typescript
// src/app/api/uploadthing/core.ts
export const ourFileRouter = {
  personnelPhotos: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      // Authentication logic
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Personnel photo uploaded:", file.url);
      return { uploadedBy: metadata.userId, url: file.url };
    }),
};
```

## Usage in Components

### Add Personnel Modal

```typescript
// Image upload section
<UploadThingUpload
  endpoint="personnelPhotos"
  onUploadComplete={handleImageUpload}
  onUploadError={handleImageError}
  maxFiles={1}
  accept="image/*"
  placeholder="Choose personnel photo"
/>

// Form includes image URL
const personnelData = {
  // ... personal data
  photo_url: selectedImage || null, // UploadThing URL
};
```

### Personnel Display

```typescript
// Fast image loading from CDN
<Avatar className="w-20 h-20">
  <AvatarImage src={personnel.photo_url} alt={personnel.first_name} />
  <AvatarFallback>
    {personnel.first_name[0]}{personnel.last_name[0]}
  </AvatarFallback>
</Avatar>
```

## Migration Guide

### From Single Storage to Hybrid

1. **Install UploadThing**: `npm install uploadthing @uploadthing/react`
2. **Add photo_url column**: Run `scripts/add-photo-url-column.sql`
3. **Configure endpoints**: Set up UploadThing file router
4. **Update components**: Replace file upload components
5. **Test uploads**: Verify images upload to UploadThing and URLs save to Firebase

### Data Migration

```sql
-- If migrating existing images, update URLs
UPDATE personnel 
SET photo_url = 'https://uploadthing.com/f/' || old_image_path 
WHERE old_image_path IS NOT NULL;
```

## Best Practices

### Security
- ✅ Validate file types and sizes in UploadThing middleware
- ✅ Authenticate users before allowing uploads
- ✅ Use signed URLs for private images if needed
- ✅ Sanitize filenames and metadata

### Performance
- ✅ Use UploadThing's automatic image optimization
- ✅ Implement lazy loading for image galleries
- ✅ Cache personnel data in React state/context
- ✅ Use Next.js Image component for optimization

### Maintenance
- ✅ Monitor UploadThing usage and costs
- ✅ Clean up orphaned files periodically
- ✅ Backup image URLs in Firebase exports
- ✅ Test image loading in different regions

## Troubleshooting

### Common Issues

1. **Images not loading**: Check UploadThing URL format and CDN status
2. **Upload failures**: Verify API keys and file size limits
3. **Slow loading**: Ensure CDN is properly configured
4. **Missing images**: Check if URLs are correctly saved in database

### Debug Commands

```bash
# Check UploadThing configuration
curl -H "Authorization: Bearer $UPLOADTHING_SECRET" \
  https://uploadthing.com/api/listFiles

# Verify database schema
psql -c "\d personnel" # For PostgreSQL/Supabase
```

This hybrid approach provides the best of both worlds: secure personal data management with Firebase and fast, optimized image delivery via UploadThing CDN.

## Firestore Collections Schema

### Circulars Collection
```typescript
interface Circular {
  id: string;                    // Auto-generated document ID
  title: string;                 // Circular title
  message: string;               // Circular content
  unit: string;                  // Target unit or "all"
  channels: string[];            // ["email", "sms"] - always both
  recipient_count: number;       // Number of recipients
  status: "sent" | "draft";      // Circular status
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
}
```

### Circular Recipients Collection
```typescript
interface CircularRecipient {
  id: string;                    // Format: "{circular_id}_{personnel_id}"
  circular_id: string;           // Reference to circular
  personnel_id: string;          // Reference to personnel
  email_status: "pending" | "sent" | "delivered" | "failed";
  sms_status: "pending" | "sent" | "delivered" | "failed";
  created_at: string;            // ISO timestamp
}
```
