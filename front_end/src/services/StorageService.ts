import axios, { type AxiosInstance } from 'axios';

interface SignatureResponse {
  signature: string;
  timestamp: number;
  api_key: string;
  cloud_name: string;
  folder: string;
  tags?: string; // Thêm trường tags nếu Backend trả về
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
      console.log('Signature response from backend:', response);
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
    // 1. Chuẩn bị tags (phải giống hệt lúc gửi lên Backend để ký)
    const tagsParam = options.tags && options.tags.length > 0 
      ? options.tags.join(',') 
      : undefined;

    // 2. Lấy signature từ Backend
    const sigResponse = await this.getSignature(options.folder, tagsParam);
    const { signature, timestamp, api_key, cloud_name, folder, tags } = sigResponse;

    // 3. Tạo FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', api_key);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', folder);

    // QUAN TRỌNG: Chỉ thêm tags nếu signature đã bao gồm tags
    if (tags) {
      formData.append('tags', tags);
    }

    // 4. Xác định resourceType
    // Với PDF/Doc nên dùng 'raw', với ảnh dùng 'image'. 
    // Nếu không chắc, bạn có thể truyền từ options hoặc dùng 'auto'
    const resourceType =  'raw'; 
    
    // URL upload của Cloudinary
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/${resourceType}/upload`;

    const uploadResponse = await axios.post(uploadUrl, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }, // Axios sẽ tự xử lý boundary
      timeout: 60000,
    });

    return uploadResponse.data.secure_url;
  } catch (error: unknown) {
    console.error('Chi tiết lỗi Cloudinary:', (error as { response?: { data?: unknown } }).response?.data || (error as { message?: string }).message);
    throw new Error(`Upload thất bại: ${(error as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message || (error as { message?: string }).message}`);
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
