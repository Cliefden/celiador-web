# Profiles Integration

This document describes the integration of comprehensive user profiles across the Bether platform's Swift models, Next.js backend, and Supabase database.

## Overview

We've added a comprehensive `profiles` table to provide rich user information and proper audit trail support. This enhances the authentication system and provides a foundation for user management features.

## Why Profiles Are Essential

### 1. **Rich User Information**
- **Comprehensive Data**: Full name, contact info, avatar, website, etc.
- **Structured Names**: Detailed name components (prefix, first, middle, last, suffix)
- **User Roles**: Support for different user types (user, admin, superadmin)

### 2. **Audit Trail Foundation**
- **Creator Tracking**: Who created each record
- **Updater Tracking**: Who last modified each record
- **Deleter Tracking**: Who deleted each record (soft delete)
- **Timestamps**: When records were created, updated, deleted

### 3. **Data Integrity**
- **Foreign Key Relationships**: Proper references between tables
- **Cascade Operations**: Clean deletion when users are removed
- **Consistent User Data**: Single source of truth for user information

## Database Schema

### Profiles Table Structure

```sql
CREATE TABLE profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Audit fields
  creator UUID,
  updater UUID,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleter UUID,
  deletedAt TIMESTAMP WITH TIME ZONE,
  
  -- Basic profile information
  username TEXT UNIQUE,
  full_name TEXT,
  website TEXT,
  avatar_url TEXT,
  
  -- Detailed name components
  name_prefix TEXT,
  first_name TEXT,
  middle_name TEXT,
  pre_last_name TEXT,
  last_name TEXT,
  name_suffix TEXT,
  
  -- Contact information
  phone_number TEXT,
  personal_id TEXT,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Implementation Details

### 1. Swift Models (`bether_swift/Bether/Shared/Models/Profile.swift`)

**Profile.swift:**
```swift
public struct Profile: SBTable, SBListable, SBTypeNameable, SBManageable, Named, Hashable {
    // Audit fields
    public var creator: profileID?
    public var updater: profileID?
    public var updatedAt: Date?
    public var deleter: profileID?
    public var deletedAt: Date?
    
    // Basic profile information
    public var username: String?
    public var fullName: String?
    public var website: String?
    public var avatarURL: String?
    
    // Detailed name components
    public var namePrefix: String?
    public var firstName: String?
    public var middleName: String?
    public var preLastName: String?
    public var lastName: String?
    public var nameSuffix: String?
    
    // Contact information
    public var phoneNumber: String?
    public var personalId: String?
    public var email: String?
    public var role: ProfileRole?
    
    // Timestamps
    public var createdAt: Date?
}
```

**Key Features:**
- **ProfileRole Enum**: Type-safe user roles
- **Computed Properties**: `name`, `wholeName`, `initials`, `displayName`
- **Protocol Conformance**: Full integration with your design system

### 2. Supabase Database Schema

**Updated `supabase-profiles-setup.sql`:**
- Complete profiles table with all fields
- Automatic triggers for audit field population
- RLS policies for secure access control
- Automatic profile creation on user signup
- Performance indexes for efficient queries

**Key Features:**
- **Automatic Audit**: Triggers set `creator` on insert and `updater` on update
- **User Sync**: Automatic profile creation when users sign up
- **RLS Integration**: Secure access control based on user relationships
- **Performance**: Indexes on frequently queried fields

### 3. Prisma Schemas

**Updated both `apps/orchestrator/prisma/schema.prisma` and `workers/codegen/prisma/schema.prisma`:**
```prisma
model Profile {
  id        String   @id @default(cuid())
  
  // Audit fields
  creator   String?
  updater   String?
  updatedAt DateTime @default(now())
  deleter   String?
  deletedAt DateTime?
  
  // Basic profile information
  username  String?  @unique
  fullName  String?  @map("full_name")
  website   String?
  avatarURL String?  @map("avatar_url")
  
  // Detailed name components
  namePrefix   String? @map("name_prefix")
  firstName    String? @map("first_name")
  middleName   String? @map("middle_name")
  preLastName  String? @map("pre_last_name")
  lastName     String? @map("last_name")
  nameSuffix   String? @map("name_suffix")
  
  // Contact information
  phoneNumber String? @map("phone_number")
  personalId  String? @map("personal_id")
  email       String? @unique
  role        String? @default("user") // 'user', 'admin', 'super'
  
  // Timestamps
  createdAt DateTime @default(now()) @map("created_at")

  @@map("profiles")
}
```

## Benefits

### 1. **Enhanced User Experience**
- **Rich Profiles**: Users can provide comprehensive information
- **Avatar Support**: Profile pictures and branding
- **Contact Information**: Phone, email, website for communication
- **Role-Based Features**: Different capabilities based on user role

### 2. **Improved Audit Trail**
- **Complete Tracking**: Who did what and when
- **Soft Delete Support**: Maintains data integrity
- **Change History**: Track all modifications to records
- **Compliance Ready**: Meets data governance requirements

### 3. **Scalable Architecture**
- **Extensible Design**: Easy to add new profile fields
- **Performance Optimized**: Indexes and efficient queries
- **Security First**: RLS policies and proper access control
- **Cross-Platform**: Consistent data across Swift and Next.js

### 4. **Developer Experience**
- **Type Safety**: Strongly typed models and enums
- **Auto-Generation**: Automatic profile creation on signup
- **Consistent APIs**: Same data structure across platforms
- **Rich Tooling**: Computed properties and helper methods

## Usage Examples

### Swift - Creating a Profile
```swift
let profile = Profile(
    username: "johndoe",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    role: .user
)
```

### Swift - Accessing Profile Data
```swift
// Get formatted name
let displayName = profile.wholeName

// Get initials
let initials = profile.initials

// Check role
if profile.role == .admin {
    // Admin-specific functionality
}
```

### Next.js - Profile Operations
```javascript
// Get user profile
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();

// Update profile
const { data: updatedProfile } = await supabase
  .from('profiles')
  .update({ 
    fullName: 'John Doe',
    website: 'https://johndoe.com'
  })
  .eq('id', userId)
  .select()
  .single();
```

## Migration Process

### For New Installations
1. Run the `supabase-profiles-setup.sql` script
2. Generate Prisma client: `pnpm db:generate`
3. Push schema: `pnpm db:push`

### For Existing Installations
1. Run the profiles setup script
2. Update Prisma schemas
3. Generate and push Prisma client
4. Restart services

## Future Enhancements

### 1. **Profile Management UI**
- Profile editing interface
- Avatar upload functionality
- Role management for admins
- Profile completion wizard

### 2. **Advanced Features**
- Profile verification system
- Social media integration
- Profile privacy settings
- Profile analytics
- Role-based permissions (user, admin, superadmin)

### 3. **Integration Features**
- Profile-based notifications
- User activity tracking
- Profile-based permissions
- Team collaboration features

## Security Considerations

### 1. **Data Protection**
- RLS policies ensure users only access their own data
- Sensitive fields (phone, personal ID) are optional
- Email addresses are unique and validated

### 2. **Role-Based Access**
- Different user roles have different capabilities (user, admin, superadmin)
- Admin users can manage other profiles
- Superadmin users have full system access
- Service role bypasses RLS for system operations

### 3. **Audit Compliance**
- Complete audit trail for all operations
- Soft delete maintains data integrity
- Timestamps for compliance reporting

The profiles integration provides a robust foundation for user management, audit trails, and enhanced user experiences across the Bether platform! 🎉
