# Firebase Setup Guide - MADPC Police Command System

## Overview

MADPC uses **Firebase Firestore** as its primary database, providing a scalable NoSQL solution with real-time updates and excellent integration with Firebase Authentication.

## Quick Start

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "madpc-police-system")
4. Follow the setup wizard

### 2. Enable Firestore Database

1. In your Firebase project, click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" for development (you can secure it later)
4. Select a location close to your users
5. Click "Done"

### 3. Set Up Authentication

1. Click "Authentication" in the left sidebar
2. Click "Get started"
3. Click "Sign-in method" tab
4. Enable "Email/Password" provider
5. Click "Save"

### 4. Configure Environment Variables

Copy your Firebase configuration to `.env.local`:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## How It Works

The system uses Firebase Firestore for all data operations:

```typescript
import { db } from "@/integrations/database";

// All operations use Firebase Firestore
const personnel = await db.getPersonnel();
const newCase = await db.createCase(caseData);
await db.updatePersonnel(id, updates);
await db.deleteDuty(id);
```

## Database Operations

### Personnel Management
- `db.getPersonnel()` - Fetch all personnel
- `db.createPersonnel(data)` - Create new personnel record
- `db.updatePersonnel(id, data)` - Update existing personnel
- `db.deletePersonnel(id)` - Delete personnel record

### Case Management
- `db.getCases()` - Fetch all cases
- `db.createCase(data)` - Create new case
- `db.deleteCase(id)` - Delete case

### Duty Management
- `db.getDuties()` - Fetch all duties
- `db.createDuty(data)` - Create new duty
- `db.updateDuty(id, data)` - Update duty status
- `db.deleteDuty(id)` - Delete duty

## Firebase Security Rules

### Basic Security Rules

Set up basic security rules in your Firestore console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Advanced Security Rules

For production, implement more restrictive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Personnel collection
    match /personnel/{personnelId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.token.role == 'district_commander' || 
         request.auth.token.role == 'unit_supervisor');
    }
    
    // Cases collection
    match /cases/{caseId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Duties collection
    match /duties/{dutyId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## Data Structure

### Collections

The system uses these main collections:

1. **personnel** - Officer and staff information
2. **cases** - Investigation and incident records
3. **duties** - Assignment and scheduling data
4. **profiles** - User authentication profiles

### Document Structure

Each document follows a consistent structure with:
- `id` - Unique document identifier
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- Collection-specific fields

## Development vs Production

### Development
- Use "test mode" security rules for easy development
- Enable Firebase Emulator for local development
- Use development Firebase project

### Production
- Implement proper security rules
- Use production Firebase project
- Set up proper authentication methods
- Configure backup and monitoring

## Troubleshooting

### Common Issues

1. **"Permission denied" errors**
   - Check your Firestore security rules
   - Ensure user is authenticated
   - Verify user has proper permissions

2. **"Project not found" errors**
   - Verify Firebase project ID in environment variables
   - Check Firebase project is active
   - Ensure API key is correct

3. **Authentication issues**
   - Verify Firebase Auth is enabled
   - Check authentication provider settings
   - Ensure proper sign-in flow

### Debug Information

The system provides utility functions to help debug:

```typescript
import { db } from "@/integrations/database";

console.log("Current backend:", db.getCurrentBackend());
console.log("Using Firestore:", db.isFirestore());
```

## Best Practices

1. **Security First**: Always implement proper security rules
2. **Data Validation**: Validate data before writing to Firestore
3. **Error Handling**: Implement proper error handling for database operations
4. **Performance**: Use indexes for frequently queried fields
5. **Backup**: Set up regular data backups

## Firebase Console Features

### Useful Tools

1. **Firestore Database**: View and edit data
2. **Authentication**: Manage users and sign-in methods
3. **Storage**: File uploads and management
4. **Analytics**: Usage and performance metrics
5. **Functions**: Serverless backend functions (optional)

### Monitoring

- **Usage**: Monitor database reads/writes
- **Performance**: Track query performance
- **Errors**: View and debug errors
- **Security**: Monitor authentication and access patterns

## Support

For Firebase-specific issues:
- **Firebase Documentation**: [firebase.google.com/docs](https://firebase.google.com/docs)
- **Firebase Console**: [console.firebase.google.com](https://console.firebase.google.com)
- **Firebase Support**: [firebase.google.com/support](https://firebase.google.com/support)

For MADPC system issues:
- Check the main [README.md](./README.md)
- Contact the MADPC Development Team
