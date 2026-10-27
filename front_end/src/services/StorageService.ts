import axios, { type AxiosInstance } from 'axios';

interface SignatureResponse {
  signature: string;
  timestamp: number;
  api_key: string;
  cloud_name: string;
  folder: string;
  tags?: string;
}

export interface UploadOptions {
  folder?: string;
  tags?: string[];
  resourceType?: 'auto' | 'image' | 'video';
}

class StorageService {
  private apiClient: AxiosInstance;

  constructor(backendUrl: string = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api/v1') {
    this.apiClient = axios.create({
      baseURL: backendUrl,
      timeout: 30000,
    });
  }

  private async getSignature(folder?: string, tags?: string): Promise<SignatureResponse> {
    try {
      const response = await this.apiClient.get('/storage/signature', {
        params: {
          folder,
          tags
        },
      });
      console.log('Signature response from backend:', response);
      return response.data.data;
    } catch (error) {
      throw new Error(`Không thể lấy signature: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

 async uploadFile(file: File, options: UploadOptions = {}): Promise<string> {
  try {
    const tagsParam = options.tags && options.tags.length > 0 
      ? options.tags.join(',') 
      : undefined;

    const sigResponse = await this.getSignature(options.folder, tagsParam);
    const { signature, timestamp, api_key, cloud_name, folder, tags } = sigResponse;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', api_key);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', folder);

    if (tags) {
      formData.append('tags', tags);
    }

    const resourceType = options.resourceType || 'auto'; 
    
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/${resourceType}/upload`;

    const uploadResponse = await axios.post(uploadUrl, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });

    return uploadResponse.data.secure_url;
  } catch (error: any) {
    console.error('Chi tiết lỗi Cloudinary:', error.response?.data || error.message);
    throw new Error(`Upload thất bại: ${error.response?.data?.error?.message || error.message}`);
  }
}

  async uploadMultipleFiles(files: File[], options: UploadOptions = {}): Promise<string[]> {
    try {
      const uploadPromises = files.map((file) => this.uploadFile(file, options));
      return await Promise.all(uploadPromises);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Lỗi upload multiple files:', errorMessage);
      throw new Error(`Upload multiple files thất bại: ${errorMessage}`);
    }
  }

  async uploadImage(file: File, options: UploadOptions = {}): Promise<string> {
    return this.uploadFile(file, { ...options, resourceType: 'image' });
  }

  async uploadVideo(file: File, options: UploadOptions = {}): Promise<string> {
    return this.uploadFile(file, { ...options, resourceType: 'video' });
  }

  async uploadPDF(file: File, options: UploadOptions = {}): Promise<string> {
    return this.uploadFile(file, { ...options, resourceType: 'auto' });
  }

  validateFile(file: File, maxSize: number = 10 * 1024 * 1024, allowedTypes: string[] = []): { valid: boolean; error?: string } {
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File quá lớn. Kích thước tối đa: ${maxSize / 1024 / 1024}MB`,
      };
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Loại file không được hỗ trợ. Cho phép: ${allowedTypes.join(', ')}`,
      };
    }

    return { valid: true };
  }
}

export default new StorageService();

export { StorageService };
