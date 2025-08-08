# File Storage Implementation Guide

## Overview

This guide covers the comprehensive file storage system implemented for the MADPC (Manso Adubia District Police Command) application. The system uses Supabase Storage for secure, scalable file management across different entity types.

## Storage Architecture

### Storage Buckets

The system uses 5 dedicated storage buckets:

1. **personnel-photos** (Public)
   - Personnel profile photos
   - Max size: 5MB
   - Allowed types: JPEG, PNG, WebP
   - Public read access for avatars

2. **case-evidence** (Private)
   - Case investigation evidence files
   - Max size: 50MB
   - Allowed types: Images, PDFs, Videos, Audio
   - Authenticated access only

3. **documents** (Private)
   - General document attachments
   - Max size: 10MB
   - Allowed types: PDF, DOC, DOCX, TXT
   - Authenticated access only

4. **reports** (Private)
   - Report attachments and exports
   - Max size: 10MB
   - Allowed types: PDF, DOC, DOCX, TXT
   - Authenticated access only

5. **imports** (Private)
   - CSV/Excel import files
   - Max size: 10MB
   - Allowed types: CSV, XLS, XLSX
   - Authenticated access only

## Components

### Core Components

#### 1. FileUpload Component (`src/components/ui/file-upload.tsx`)
- Reusable drag-and-drop file upload component
- Progress tracking and validation
- Multiple file support
- Preview functionality

#### 2. PersonnelPhotoUpload (`src/components/PersonnelPhotoUpload.tsx`)
- Personnel profile photo management
- Avatar display with fallback initials
- Upload, update, and delete functionality

#### 3. CaseEvidenceUpload (`src/components/CaseEvidenceUpload.tsx`)
- Case evidence file management
- Multiple file types support
- Download and delete capabilities
- File metadata tracking

#### 4. DocumentAttachment (`src/components/DocumentAttachment.tsx`)
- General document attachment system
- Supports multiple entity types
- Named attachments with descriptions

#### 5. CSVImportExport (`src/components/CSVImportExport.tsx`)
- CSV/Excel import and export functionality
- Template download support
- Data validation and error reporting

### Utility Functions

#### File Storage Utils (`src/utils/fileStorage.ts`)
- `uploadFile()` - Upload files to Supabase storage
- `deleteFile()` - Delete files from storage
- `validateFile()` - Validate file type and size
- `getSignedUrl()` - Get temporary download URLs
- `listFiles()` - List files in storage buckets

## Usage Examples

### Personnel Photo Upload

```tsx
import { PersonnelPhotoUpload } from "@/components/PersonnelPhotoUpload";

<PersonnelPhotoUpload
  personnelId="uuid"
  currentPhotoUrl="https://..."
  badgeNumber="P001"
  fullName="John Doe"
  onPhotoUpdate={(url) => console.log("Photo updated:", url)}
  size="lg"
  editable={true}
/>
```

### Case Evidence Management

```tsx
import { CaseEvidenceUpload } from "@/components/CaseEvidenceUpload";

<CaseEvidenceUpload
  caseId="uuid"
  caseNumber="CAS001"
  onEvidenceUpdate={() => refreshCaseData()}
  readonly={false}
/>
```

### Document Attachments

```tsx
import { DocumentAttachment } from "@/components/DocumentAttachment";

<DocumentAttachment
  entityId="uuid"
  entityType="case"
  attachments={attachments}
  onAttachmentsUpdate={setAttachments}
  title="Case Documents"
  maxFiles={5}
/>
```

### CSV Import/Export

```tsx
import { CSVImportExport } from "@/components/CSVImportExport";

<CSVImportExport
  entityType="personnel"
  onImportComplete={handleImport}
  onExportRequest={handleExport}
  importTemplate={csvTemplate}
/>
```

## File Validation

### Supported File Types

#### Images (Personnel Photos, Evidence)
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- Max size: 5MB (photos), 50MB (evidence)

#### Documents
- PDF (.pdf)
- Microsoft Word (.doc, .docx)
- Plain Text (.txt)
- Max size: 10MB

#### Spreadsheets (Import/Export)
- CSV (.csv)
- Microsoft Excel (.xls, .xlsx)
- Max size: 10MB

#### Media (Evidence Only)
- Video: MP4, WebM
- Audio: MP3, WAV
- Max size: 50MB

## Security Features

### Row Level Security (RLS)
- All storage buckets have RLS policies
- Authenticated users only (except public personnel photos)
- Proper access control per bucket type

### File Validation
- MIME type checking
- File size limits
- Extension validation
- Malicious file detection

### Secure URLs
- Signed URLs for private files
- Temporary access tokens
- Automatic expiration

## Database Schema

### Personnel Table Addition
```sql
ALTER TABLE personnel 
ADD COLUMN photo_url TEXT;
```

### Evidence Files Table
```sql
CREATE TABLE evidence_files (
  id UUID PRIMARY KEY,
  case_id UUID REFERENCES cases(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Document Attachments Table
```sql
CREATE TABLE document_attachments (
  id UUID PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Setup Instructions

### 1. Run Storage Setup Script
Execute the SQL script in your Supabase dashboard:
```bash
# Run scripts/setup-storage.sql in Supabase SQL Editor
```

### 2. Configure Environment Variables
Ensure your Supabase credentials are properly configured:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Test File Upload
1. Navigate to Personnel page
2. Try uploading a profile photo
3. Check Supabase Storage dashboard
4. Verify file appears in personnel-photos bucket

## Best Practices

### File Naming
- Use unique filenames to prevent conflicts
- Include timestamps and random strings
- Organize files in folders by entity type

### Error Handling
- Always validate files before upload
- Provide clear error messages to users
- Handle network failures gracefully

### Performance
- Use appropriate file sizes
- Implement progress indicators
- Cache file URLs when possible

### Security
- Never trust client-side validation alone
- Use signed URLs for sensitive files
- Regularly audit file access logs

## Troubleshooting

### Common Issues

#### Upload Failures
- Check file size limits
- Verify MIME types are allowed
- Ensure user is authenticated
- Check network connectivity

#### Permission Errors
- Verify RLS policies are correct
- Check user authentication status
- Ensure bucket exists and is configured

#### File Not Found
- Check if file was actually uploaded
- Verify file path is correct
- Ensure bucket permissions allow access

### Debug Tools
- Browser Network tab for upload requests
- Supabase Storage dashboard for file verification
- Console logs for detailed error messages

## Future Enhancements

### Planned Features
- Image resizing and optimization
- Virus scanning integration
- Advanced file search and filtering
- Bulk file operations
- File versioning system
- Automated backup and archival

### Performance Optimizations
- CDN integration for faster delivery
- Image compression and WebP conversion
- Lazy loading for file lists
- Caching strategies for frequently accessed files
