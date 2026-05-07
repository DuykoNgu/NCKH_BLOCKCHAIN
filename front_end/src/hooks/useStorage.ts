import { useMutation } from '@tanstack/react-query';
import StorageService, { StorageService as StorageServiceClass } from '../services/StorageService';
import type { UploadOptions } from '../services/StorageService';

/**
 * React Hook để sử dụng Storage Service bằng TanStack Query
 */
export const useStorage = (storageService: StorageServiceClass = StorageService) => {
  const uploadFileMutation = useMutation({
    mutationFn: ({ file, options }: { file: File; options?: UploadOptions }) => 
      storageService.uploadFile(file, options)
  });

  const uploadImageMutation = useMutation({
    mutationFn: ({ file, options }: { file: File; options?: UploadOptions }) => 
      storageService.uploadImage(file, options)
  });

  const uploadVideoMutation = useMutation({
    mutationFn: ({ file, options }: { file: File; options?: UploadOptions }) => 
      storageService.uploadVideo(file, options)
  });

  const uploadPDFMutation = useMutation({
    mutationFn: ({ file, options }: { file: File; options?: UploadOptions }) => 
      storageService.uploadPDF(file, options)
  });

  const uploadMultipleMutation = useMutation({
    mutationFn: ({ files, options }: { files: File[]; options?: UploadOptions }) => 
      storageService.uploadMultipleFiles(files, options)
  });

  return {
    uploading: 
      uploadFileMutation.isPending || 
      uploadImageMutation.isPending || 
      uploadVideoMutation.isPending || 
      uploadPDFMutation.isPending || 
      uploadMultipleMutation.isPending,
    error: 
      (uploadFileMutation.error as any)?.message || 
      (uploadImageMutation.error as any)?.message || 
      (uploadVideoMutation.error as any)?.message || 
      (uploadPDFMutation.error as any)?.message || 
      (uploadMultipleMutation.error as any)?.message || 
      null,
    uploadFile: (file: File, options?: UploadOptions) => uploadFileMutation.mutateAsync({ file, options }),
    uploadImage: (file: File, options?: UploadOptions) => uploadImageMutation.mutateAsync({ file, options }),
    uploadVideo: (file: File, options?: UploadOptions) => uploadVideoMutation.mutateAsync({ file, options }),
    uploadPDF: (file: File, options?: UploadOptions) => uploadPDFMutation.mutateAsync({ file, options }),
    uploadMultipleFiles: (files: File[], options?: UploadOptions) => uploadMultipleMutation.mutateAsync({ files, options }),
    clearError: () => {
      uploadFileMutation.reset();
      uploadImageMutation.reset();
      uploadVideoMutation.reset();
      uploadPDFMutation.reset();
      uploadMultipleMutation.reset();
    },
  };
};
