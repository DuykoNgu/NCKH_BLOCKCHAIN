import { useState, useCallback } from 'react';
import StorageService, { StorageService as StorageServiceClass } from '../services/StorageService';
import type { UploadOptions } from '../services/StorageService';

interface UseStorageReturn {
  uploading: boolean;
  error: string | null;
  uploadFile: (file: File, options?: UploadOptions) => Promise<string>;
  uploadImage: (file: File, options?: UploadOptions) => Promise<string>;
  uploadVideo: (file: File, options?: UploadOptions) => Promise<string>;
  uploadPDF: (file: File, options?: UploadOptions) => Promise<string>;
  uploadMultipleFiles: (files: File[], options?: UploadOptions) => Promise<string[]>;
  clearError: () => void;
}

/**
 * React Hook để sử dụng Storage Service
 * @param storageService - Instance của StorageService (mặc định là singleton)
 * @returns Upload handlers và state
 */
export const useStorage = (storageService: StorageServiceClass = StorageService): UseStorageReturn => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = useCallback(
    async <T,>(uploadFn: () => Promise<T>): Promise<T> => {
      try {
        setUploading(true);
        setError(null);
        const result = await uploadFn();
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        throw err;
      } finally {
        setUploading(false);
      }
    },
    []
  );

  const uploadFile = useCallback(
    (file: File, options?: UploadOptions) =>
      handleUpload(() => storageService.uploadFile(file, options)),
    [storageService, handleUpload]
  );

  const uploadImage = useCallback(
    (file: File, options?: UploadOptions) =>
      handleUpload(() => storageService.uploadImage(file, options)),
    [storageService, handleUpload]
  );

  const uploadVideo = useCallback(
    (file: File, options?: UploadOptions) =>
      handleUpload(() => storageService.uploadVideo(file, options)),
    [storageService, handleUpload]
  );

  const uploadPDF = useCallback(
    (file: File, options?: UploadOptions) =>
      handleUpload(() => storageService.uploadPDF(file, options)),
    [storageService, handleUpload]
  );

  const uploadMultipleFiles = useCallback(
    (files: File[], options?: UploadOptions) =>
      handleUpload(() => storageService.uploadMultipleFiles(files, options)),
    [storageService, handleUpload]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    uploading,
    error,
    uploadFile,
    uploadImage,
    uploadVideo,
    uploadPDF,
    uploadMultipleFiles,
    clearError,
  };
};
