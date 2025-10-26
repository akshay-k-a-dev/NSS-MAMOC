# File Upload System Implementation

## Overview
Complete file upload system implemented for NSS MAMOC application with support for:
- Student profile photos
- Homepage images management

## Backend Implementation

### Server Configuration (server/index.js)
- **Static File Serving**: `/uploads` route serves uploaded files
- **Multer Integration**: File upload middleware configured
- **CORS Enabled**: Frontend can make API requests
- **Error Handling**: Complete error handling with file cleanup

### API Endpoints

#### 1. Student Profile Photos
**Endpoints**:
- `POST /api/students/:id/photo` - Upload profile photo
- `DELETE /api/students/:id/photo` - Delete profile photo

**Features**:
- Single image upload (5MB limit)
- Old photo cleanup when replacing
- Image validation (images only)
- Automatic URL generation

#### 3. Homepage Images
**Endpoints**:
- `POST /api/homepage-images` - Upload homepage image
- `DELETE /api/homepage-images/:id` - Delete homepage image
- `GET /api/homepage-images` - Get all homepage images

**Features**:
- Left/Right scrolling box categorization
- Image type validation
- Metadata storage for ordering

### File Storage Structure
```
uploads/
├── stories/          # Story album media
│   ├── story-{timestamp}-{random}.{ext}
├── students/         # Student profile photos  
│   ├── student-{timestamp}-{random}.{ext}
└── homepage/         # Homepage images
    ├── homepage-{timestamp}-{random}.{ext}
```

## Frontend Implementation

### 1. StoriesPage Component (/src/components/StoriesPage.tsx)
**Features**:
- Drag & drop file upload interface
- Multi-file selection
- Upload progress feedback
- Real-time UI updates
- Error handling with user feedback
- Responsive modal design

**Key Functions**:
```typescript
const handleMediaUpload = async (files: FileList, albumId: string, titles: string[])
const handleFileUpload = async () // Modal upload handler
```

### 2. StudentPortal Component (/src/components/StudentPortal.tsx)
**Features**:
- Profile photo hover upload
- File size validation (5MB limit)
- Image format validation
- Upload progress indication
- Profile update on success

**Key Functions**:
```typescript
const handlePhotoUpload = async (file: File)
```

### 3. ProgramOfficerPortal Component (/src/components/ProgramOfficerPortal.tsx)
**Existing Features**:
- Student creation with schema alignment
- Responsive form design
- All required fields (name, email, phone, department, year, enrollmentNumber)
- Form validation and error handling

### 4. HomepageImageManager Component (/src/components/HomepageImageManager.tsx)
**Features**:
- Multiple image upload with API integration
- Left/Right scrolling box management
- Image preview and management
- Delete functionality with API calls
- Drag and drop reordering
- Real-time updates

**Key Functions**:
```typescript
const handleFileUpload = async (files: FileList | null, type: 'left' | 'right')
const handleDeleteImage = async (imageId: string, type: 'left' | 'right')
```

## Database Schema Updates

### Students Table
```sql
profilePhotoUrl: String? -- URL to uploaded profile photo
```

### Stories Tables
```sql
StoryMedia {
  id: String
  title: String
  url: String      -- Path to uploaded file
  type: String     -- 'image' or 'video'
  albumId: String
  order: Int
  isActive: Boolean
}
```

### Homepage Images Table
```sql
HomepageImage {
  id: String
  url: String      -- Path to uploaded file
  type: String     -- 'left' or 'right'
  alt: String
  order: Int
  isActive: Boolean
}
```

## File Upload Flow

### 1. Frontend Upload Process
```
1. User selects files → File validation (size, type)
2. FormData creation → Include metadata (albumId, titles, etc.)
3. API request with FormData → Upload to backend
4. Response handling → Update UI state
5. Success/Error feedback → User notification
```

### 2. Backend Processing
```
1. Multer processes files → Save to disk with unique names
2. File validation → Check type and size limits
3. Database operations → Store metadata
4. Error handling → Cleanup files on failure
5. Response generation → Return file URLs and metadata
```

## Security Features

### File Validation
- **Size Limits**: 5MB for images, 50MB for videos
- **Type Validation**: Only allowed MIME types
- **Filename Sanitization**: Unique generated names
- **Path Traversal Protection**: Controlled upload directories

### Error Handling
- **File Cleanup**: Automatic deletion on errors
- **Database Rollback**: Consistent state maintenance
- **User Feedback**: Clear error messages
- **Server Logging**: Comprehensive error logging

## Usage Examples

### Upload Story Media
```typescript
// Select files
const files = document.querySelector('input[type="file"]').files;

// Create form data
const formData = new FormData();
formData.append('albumId', 'album-123');
formData.append('titles', JSON.stringify(['Image 1', 'Image 2']));
Array.from(files).forEach(file => formData.append('files', file));

// Upload
const response = await fetch('/api/stories/media', {
  method: 'POST',
  body: formData
});
```

### Upload Student Photo
```typescript
// Select photo
const photoInput = document.querySelector('input[type="file"]');
const file = photoInput.files[0];

// Create form data
const formData = new FormData();
formData.append('photo', file);

// Upload
const response = await fetch(`/api/students/${studentId}/photo`, {
  method: 'POST',
  body: formData
});
```

## Testing

### API Testing
All endpoints tested with curl commands:
- ✅ Stories batch creation and media upload
- ✅ Student creation with all schema fields
- ✅ Homepage images API functionality
- ✅ File serving through static route

### Frontend Testing
- ✅ Responsive forms on all screen sizes
- ✅ File upload interfaces functional
- ✅ Error handling and user feedback
- ✅ Real-time UI updates

## Deployment Notes

### Environment Setup
1. Ensure `uploads/` directories exist or are created automatically
2. Configure proper file permissions for upload directories
3. Set appropriate CORS origins for production
4. Configure reverse proxy to serve static files efficiently

### Production Considerations
- Use cloud storage (AWS S3, Cloudinary) for scalability
- Implement image compression and optimization
- Add virus scanning for uploaded files
- Implement proper backup strategies for uploaded files
- Consider CDN for file serving

## Complete File Upload System Status: ✅ IMPLEMENTED

All requested features have been successfully implemented:
- ✅ Stories/Albums media upload with backend API
- ✅ Student profile photo upload system
- ✅ Homepage images dynamic management
- ✅ Complete file serving and storage
- ✅ Error handling and cleanup
- ✅ Responsive UI for all screen sizes
- ✅ Database schema alignment
- ✅ Security validation and protection

The system is ready for production use with proper file upload, storage, and management capabilities across all required modules.
