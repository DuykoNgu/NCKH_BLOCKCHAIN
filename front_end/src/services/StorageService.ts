import axios, { type AxiosInstance } from 'axios';

interface SignatureResponse {
  signature: string;
  timestamp: number;
  api_key: string;
  cloud_name: string;
  folder: string;
  tags?: string; // Thêm trường tags nếu Backend trả về
}

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  created_at?: string;
  [key: string]: unknown;
}

export interface UploadOptions {
  folder?: string;
  tags?: string[];
  resourceType?: 'auto' | 'image' | 'video';
}

class StorageService {
  private apiClient: AxiosInstance;
  private backendUrl: string;
  private cloudinaryUrl = 'https://api.cloudinary.com/v1_1';

  constructor(backendUrl: string = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api/v1') {
    this.backendUrl = backendUrl;
    this.apiClient = axios.create({
      baseURL: backendUrl,
      timeout: 30000,
    });
  }

  /**
   * Lấy Signature từ Flask Backend
   */
  private async getSignature(folder?: string, tags?: string): Promise<SignatureResponse> {
    try {
      const response = await this.apiClient.get('/storage/signature', {
        params: {
          folder,
          tags
        },
      });
      return response.data.data;
    } catch (error) {
      throw new Error(`Không thể lấy signature: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload file lên Cloudinary
   * @param file - File cần upload
   * @param options - Tùy chọn upload (folder, tags, resourceType)
   * @returns URL của file đã upload
   */
 async uploadFile(file: File, options: UploadOptions = {}): Promise<string> {
    try {
      // 1. Lấy signature (Lưu ý truyền tags vào nếu muốn dùng)
      const signature = await this.getSignature(options.folder, options.tags?.join(','));
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signature.api_key);
      formData.append('timestamp', signature.timestamp.toString());
      formData.append('signature', signature.signature);
      formData.append('folder', signature.folder);

      // CHỈ thêm tags nếu Backend đã ký và trả về tags đó
      if (signature.tags) {
        formData.append('tags', signature.tags);
      }

      const resourceType = options.resourceType || 'auto';
      const uploadUrl = `${this.cloudinaryUrl}/${signature.cloud_name}/${resourceType}/upload`;

      const uploadResponse = await axios.post<CloudinaryUploadResponse>(uploadUrl, formData, {
        // Bỏ Content-Type header để Axios tự nhận diện boundary
        timeout: 60000,
      });

      return uploadResponse.data.secure_url;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Lỗi upload file:', errorMessage);
      throw new Error(`Upload thất bại: ${errorMessage}`);
    }
  }

  /**
   * Upload multiple files
   * @param files - Array các file cần upload
   * @param options - Tùy chọn upload
   * @returns Array các URL của files đã upload
   */
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

  /**
   * Upload image file
   * @param file - Image file
   * @param options - Tùy chọn upload
   */
  async uploadImage(file: File, options: UploadOptions = {}): Promise<string> {
    return this.uploadFile(file, { ...options, resourceType: 'image' });
  }

  /**
   * Upload video file
   * @param file - Video file
   * @param options - Tùy chọn upload
   */
  async uploadVideo(file: File, options: UploadOptions = {}): Promise<string> {
    return this.uploadFile(file, { ...options, resourceType: 'video' });
  }

  /**
   * Upload PDF file
   * @param file - PDF file
   * @param options - Tùy chọn upload
   */
  async uploadPDF(file: File, options: UploadOptions = {}): Promise<string> {
    return this.uploadFile(file, { ...options, resourceType: 'auto' });
  }

  /**
   * Validate file trước khi upload
   * @param file - File cần kiểm tra
   * @param maxSize - Kích thước tối đa (bytes)
   * @param allowedTypes - Các loại file cho phép
   */
  validateFile(file: File, maxSize: number = 10 * 1024 * 1024, allowedTypes: string[] = []): { valid: boolean; error?: string } {
    // Kiểm tra kích thước
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File quá lớn. Kích thước tối đa: ${maxSize / 1024 / 1024}MB`,
      };
    }

    // Kiểm tra loại file
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Loại file không được hỗ trợ. Cho phép: ${allowedTypes.join(', ')}`,
      };
    }

    return { valid: true };
  }
}

// Export singleton instance
export default new StorageService();

// Hoặc export class nếu muốn tạo nhiều instance
export { StorageService };
