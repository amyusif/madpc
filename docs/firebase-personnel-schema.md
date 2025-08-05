# Firebase Personnel Collection Schema

## Collection: `personnel`

This collection stores all personnel (officers and staff) information in the police command system.

### Document Structure

```typescript
interface Personnel {
  // Basic Information
  badge_number: string;         // Unique badge identifier
  first_name: string;          // Officer's first name
  last_name: string;           // Officer's last name
  email: string;               // Official email address
  phone: string | null;        // Phone number (optional)
  
  // Professional Information
  rank: string;                // Officer's rank (constable, sergeant, etc.)
  unit: string;                // Assigned unit (patrol, investigation, etc.)
  date_joined: string;         // Date joined the force (YYYY-MM-DD)
  status: "active" | "inactive" | "suspended" | "retired";
  
  // Emergency Contacts
  emergency_contacts: string[]; // Array of emergency contact details
  
  // Personal Information
  marital_status: "Single" | "Married" | "Divorced";
  spouse: string;              // Spouse name (if married)
  children_count: number | null; // Number of children (if divorced)
  no_children: boolean;        // Flag for no children (if divorced)
  
  // Metadata
  created_at: string;          // Creation timestamp (ISO string)
  updated_at: string;          // Last update timestamp (ISO string)
}
```

### Example Document

```json
{
  "badge_number": "SGT001",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@police.gov.gh",
  "phone": "+233 24 123 4567",
  "rank": "sergeant",
  "unit": "patrol",
  "date_joined": "2020-03-15",
  "status": "active",
  "emergency_contacts": [
    "Jane Doe - +233 24 987 6543",
    "Robert Doe - +233 20 555 1234"
  ],
  "marital_status": "Married",
  "spouse": "Jane Doe",
  "children_count": null,
  "no_children": false,
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

### Rank Values

- `constable` - Constable
- `corporal` - Corporal  
- `sergeant` - Sergeant
- `inspector` - Inspector
- `chief_inspector` - Chief Inspector
- `superintendent` - Superintendent
- `chief_superintendent` - Chief Superintendent
- `assistant_commissioner` - Assistant Commissioner
- `deputy_commissioner` - Deputy Commissioner
- `commissioner` - Commissioner

### Unit Values

- `patrol` - Patrol Unit
- `investigation` - Investigation Unit
- `traffic` - Traffic Unit
- `admin` - Administration
- `special` - Special Operations

### Status Values

- **active**: Currently serving officer
- **inactive**: Temporarily inactive
- **suspended**: Under suspension
- **retired**: Retired from service

### Indexes Recommended

For optimal query performance, create these indexes in Firebase Console:

1. **badge_number** (ascending) - for unique lookups
2. **status** (ascending) - for filtering active personnel
3. **rank** (ascending) - for rank-based queries
4. **unit** (ascending) - for unit-based queries
5. **created_at** (descending) - for chronological sorting
6. **Composite**: status (ascending) + rank (ascending)
7. **Composite**: unit (ascending) + status (ascending)

### Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /personnel/{personnelId} {
      allow read, write: if request.auth != null;
      allow create: if request.auth != null && 
        request.resource.data.keys().hasAll(['badge_number', 'first_name', 'last_name', 'email']);
    }
  }
}
```

### Query Examples

```typescript
// Get all active personnel
const activePersonnel = await getDocs(
  query(
    collection(db, "personnel"),
    where("status", "==", "active"),
    orderBy("last_name", "asc")
  )
);

// Get personnel by rank
const sergeants = await getDocs(
  query(
    collection(db, "personnel"),
    where("rank", "==", "sergeant"),
    where("status", "==", "active")
  )
);

// Get personnel by unit
const patrolUnit = await getDocs(
  query(
    collection(db, "personnel"),
    where("unit", "==", "patrol"),
    orderBy("rank", "asc")
  )
);

// Search personnel by badge number
const personnelByBadge = await getDocs(
  query(
    collection(db, "personnel"),
    where("badge_number", "==", "SGT001")
  )
);
```

### Validation Rules

1. **badge_number**: Must be unique across all personnel
2. **email**: Must be valid email format and unique
3. **rank**: Must be one of the predefined rank values
4. **unit**: Must be one of the predefined unit values
5. **status**: Must be one of: active, inactive, suspended, retired
6. **date_joined**: Must be valid date in YYYY-MM-DD format
7. **emergency_contacts**: Array with at least one contact
8. **marital_status**: Must be Single, Married, or Divorced
