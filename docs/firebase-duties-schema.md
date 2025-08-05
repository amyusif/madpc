# Firebase Duties Collection Schema

## Collection: `duties`

This collection stores all duty assignments for personnel in the police command system.

### Document Structure

```typescript
interface Duty {
  // Duty Information
  duty_title: string;           // Title of the duty (e.g., "Night Patrol", "Traffic Control")
  description: string;          // Detailed description of the duty
  
  // Personnel Assignment
  personnel_id: string;         // Reference to personnel document ID
  personnel_name: string;       // Full name of assigned personnel
  personnel_rank: string;       // Rank of assigned personnel
  personnel_badge: string;      // Badge number of assigned personnel
  
  // Location and Timing
  location: string | null;      // Duty location (optional)
  start_time: string;          // Start date and time (ISO string)
  end_time: string | null;     // End date and time (ISO string, optional)
  
  // Status and Metadata
  status: "assigned" | "in_progress" | "completed" | "cancelled";
  created_at: string;          // Creation timestamp (ISO string)
  updated_at: string;          // Last update timestamp (ISO string)
}
```

### Example Document

```json
{
  "duty_title": "Night Patrol",
  "description": "Patrol the downtown area during night shift, focus on commercial district",
  "personnel_id": "personnel_123",
  "personnel_name": "John Doe",
  "personnel_rank": "Sergeant",
  "personnel_badge": "SGT001",
  "location": "Downtown Commercial District",
  "start_time": "2024-01-15T22:00:00.000Z",
  "end_time": "2024-01-16T06:00:00.000Z",
  "status": "assigned",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

### Status Values

- **assigned**: Duty has been assigned but not started
- **in_progress**: Personnel is currently performing the duty
- **completed**: Duty has been completed successfully
- **cancelled**: Duty was cancelled before completion

### Indexes Recommended

For optimal query performance, create these indexes in Firebase Console:

1. **personnel_id** (ascending)
2. **status** (ascending)
3. **start_time** (ascending)
4. **created_at** (descending)
5. **Composite**: personnel_id (ascending) + status (ascending)
6. **Composite**: status (ascending) + start_time (ascending)

### Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /duties/{dutyId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Query Examples

```typescript
// Get all duties for a specific personnel
const personnelDuties = await getDocs(
  query(
    collection(db, "duties"),
    where("personnel_id", "==", personnelId),
    orderBy("start_time", "desc")
  )
);

// Get active duties
const activeDuties = await getDocs(
  query(
    collection(db, "duties"),
    where("status", "in", ["assigned", "in_progress"]),
    orderBy("start_time", "asc")
  )
);

// Get duties for today
const today = new Date();
const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

const todayDuties = await getDocs(
  query(
    collection(db, "duties"),
    where("start_time", ">=", startOfDay),
    where("start_time", "<=", endOfDay),
    orderBy("start_time", "asc")
  )
);
```
