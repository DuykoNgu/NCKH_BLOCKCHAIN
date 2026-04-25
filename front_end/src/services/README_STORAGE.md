# StorageService - Cloudinary Upload Service

Dịch vụ tập trung để upload file lên Cloudinary từ Frontend. Hỗ trợ upload ảnh, video, PDF và file khác.

## 📦 Cài đặt

Service đã được tạo sẵn tại:
- **Service**: `src/services/StorageService.ts`
- **Hook**: `src/hooks/useStorage.ts`
- **Examples**: `src/services/StorageService.examples.tsx`

## 🚀 Sử dụng

### 1. Upload File Đơn Giản (Direct Service)

```typescript
import StorageService from '../services/StorageService';

async function handleFileUpload(file: File) {
  try {
    const url = await StorageService.uploadFile(file, {
      folder: 'my-app/uploads',
      tags: ['user-upload'],
    });
    console.log('Upload thành công:', url);
  } catch (error) {
    console.error('Upload thất bại:', error);
  }
}
```

### 2. Sử dụng Hook useStorage (Recommended for React)

```typescript
import React, { useRef } from 'react';
import { useStorage } from '../hooks/useStorage';

export const UploadComponent: React.FC = () => {
  const { uploading, error, uploadFile, clearError } = useStorage();
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);

  const handleUpload = async (file: File) => {
    try {
      clearError();
      const url = await uploadFile(file, {
        folder: 'profile-images',
      });
      setImageUrl(url);
    } catch (err) {
      console.error('Lỗi upload:', err);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        disabled={uploading}
      />
      {uploading && <p>Đang upload...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {imageUrl && <img src={imageUrl} alt="Uploaded" />}
    </div>
  );
};
```

## 📋 API Reference

### StorageService

#### `uploadFile(file: File, options?: UploadOptions): Promise<string>`
Upload file với loại tự động (auto).
```typescript
const url = await StorageService.uploadFile(file, {
  folder: 'uploads',
  tags: ['important'],
  resourceType: 'auto'
});
```

#### `uploadImage(file: File, options?: UploadOptions): Promise<string>`
Upload ảnh (resource_type: image).
```typescript
const url = await StorageService.uploadImage(file, {
  folder: 'images',
  tags: ['photo']
});
```

#### `uploadVideo(file: File, options?: UploadOptions): Promise<string>`
Upload video (resource_type: video).
```typescript
const url = await StorageService.uploadVideo(file, {
  folder: 'videos',
  tags: ['tutorial']
});
```

#### `uploadPDF(file: File, options?: UploadOptions): Promise<string>`
Upload PDF file.
```typescript
const url = await StorageService.uploadPDF(file, {
  folder: 'documents',
  tags: ['report']
});
```

#### `uploadMultipleFiles(files: File[], options?: UploadOptions): Promise<string[]>`
Upload nhiều file cùng lúc.
```typescript
const urls = await StorageService.uploadMultipleFiles([file1, file2, file3], {
  folder: 'batch',
  tags: ['batch-upload']
});
```

#### `validateFile(file: File, maxSize?: number, allowedTypes?: string[]): { valid: boolean; error?: string }`
Kiểm tra file trước khi upload.
```typescript
const validation = StorageService.validateFile(
  file,
  5 * 1024 * 1024, // 5MB
  ['image/jpeg', 'image/png']
);

if (validation.valid) {
  // Upload file
} else {
  console.error(validation.error);
}
```

### useStorage Hook

```typescript
const {
  uploading,           // boolean - Đang upload hay không
  error,              // string | null - Error message nếu có
  uploadFile,         // Function - Upload file bất kỳ
  uploadImage,        // Function - Upload ảnh
  uploadVideo,        // Function - Upload video
  uploadPDF,          // Function - Upload PDF
  uploadMultipleFiles,// Function - Upload nhiều file
  clearError          // Function - Xóa error message
} = useStorage();
```

## 📝 Ví Dụ Chi Tiết

### Ví dụ 1: Upload Ảnh Profile

```typescript
import React from 'react';
import { useStorage } from '../hooks/useStorage';

export const ProfileImageUpload: React.FC = () => {
  const { uploading, error, uploadImage, clearError } = useStorage();
  const [imageUrl, setImageUrl] = React.useState<string>('');

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      clearError();
      const url = await uploadImage(file, {
        folder: 'profile-images',
        tags: ['profile', 'avatar'],
      });
      setImageUrl(url);
      // Lưu url vào database/API
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleImageSelect} disabled={uploading} />
      {uploading && <p>Đang upload...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {imageUrl && <img src={imageUrl} alt="Profile" className="w-32 h-32 rounded" />}
    </div>
  );
};
```

### Ví dụ 2: Drag & Drop Upload

```typescript
import React from 'react';
import { useStorage } from '../hooks/useStorage';

export const DragDropUpload: React.FC = () => {
  const { uploading, error, uploadFile, clearError } = useStorage();
  const [dragActive, setDragActive] = React.useState(false);
  const [uploadedUrls, setUploadedUrls] = React.useState<string[]>([]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    try {
      clearError();
      const urls = await Promise.all(
        files.map((file) =>
          uploadFile(file, {
            folder: 'drag-drop-uploads',
          })
        )
      );
      setUploadedUrls((prev) => [...prev, ...urls]);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`border-2 border-dashed p-8 rounded ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
    >
      <p>Kéo file vào đây để upload</p>
      {uploading && <p>Đang upload...</p>}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
};
```

### Ví dụ 3: Upload Với Validation

```typescript
async function validateAndUpload(file: File) {
  // Validate file
  const validation = StorageService.validateFile(
    file,
    10 * 1024 * 1024, // 10MB
    ['image/jpeg', 'image/png', 'application/pdf']
  );

  if (!validation.valid) {
    alert(validation.error);
    return null;
  }

  // Upload nếu valid
  try {
    return await StorageService.uploadFile(file, {
      folder: 'validated-uploads',
      tags: ['validated'],
    });
  } catch (error) {
    alert('Upload failed: ' + error);
    return null;
  }
}
```

## 🔧 Cấu Hình

### Backend URL
Mặc định backend URL là `http://localhost:5000`. Để thay đổi:

```typescript
import { StorageService } from '../services/StorageService';

const customService = new StorageService('http://api.example.com');
const url = await customService.uploadFile(file);
```

### Cloudinary Endpoint
Service mặc định gọi tới backend endpoint:
```
GET http://localhost:5000/api/v1/storage/signature
```

Backend phải trả về response với structure:
```json
{
  "data": {
    "signature": "string",
    "timestamp": "number",
    "api_key": "string",
    "cloud_name": "string",
    "folder": "string"
  }
}
```

## ✅ Các Tính Năng

- ✅ Upload file đơn lẻ
- ✅ Upload multiple files
- ✅ Upload ảnh, video, PDF
- ✅ File validation (size, type)
- ✅ React Hook integration
- ✅ Error handling
- ✅ Loading state management
- ✅ TypeScript support

## 🛡️ Error Handling

```typescript
try {
  const url = await StorageService.uploadFile(file);
} catch (error) {
  if (error instanceof Error) {
    console.error('Error message:', error.message);
  }
}
```

## 📌 Notes

- Service sử dụng singleton pattern cho default export
- Mỗi upload request tự động lấy signature mới từ backend
- File được upload trực tiếp lên Cloudinary (không qua backend)
- Hook tự động handle loading state và error state

## 🔄 Flow

1. User chọn file
2. Component gọi `uploadFile()` từ hook
3. Service request signature từ backend
4. Service gửi file + signature trực tiếp tới Cloudinary
5. Cloudinary trả về secure URL
6. URL được return và lưu vào state

---

Xem file `StorageService.examples.tsx` cho thêm ví dụ chi tiết!
