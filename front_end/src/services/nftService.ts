import api from "@configs/axios.config"
import { NFT_SERVER } from '../constants/api';

import type { NFT, CreateNFTRequest, VerifyResult } from '../types/nft';
export type { NFTMetadata, NFT, CreateNFTRequest, VerifyResult } from '../types/nft';

class NFTServiceClass {
  async createNFT(data: CreateNFTRequest): Promise<{ success: boolean; token_id?: string; nft?: NFT; error?: string }> {
    try {
      const response = await api.post(NFT_SERVER.CREATE, data);
      return response.data;
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }

  async getNFT(tokenId: string): Promise<{ nft: NFT } | { error: string }> {
    try {
      const response = await api.get(NFT_SERVER.GET_BY_ID.replace(':tokenId', tokenId));
      return response.data;
    } catch (error: any) {
      return { error: error.response?.data?.error || error.message };
    }
  }

  async getStudentNFTs(studentId: string): Promise<{ total: number; nfts: NFT[] }> {
    try {
      const response = await api.get(NFT_SERVER.GET_STUDENT_NFTS.replace(':studentId', studentId));
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  async getUserNFTs(recipientAddress: string): Promise<{ total: number; nfts: NFT[] }> {
    try {
      const response = await api.get(NFT_SERVER.GET_USER_NFTS.replace(':recipientAddress', recipientAddress));
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  async getAllNFTs(): Promise<{ total: number; nfts: NFT[] }> {
    try {
      const response = await api.get(NFT_SERVER.GET_ALL);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  async verifyNFT(tokenId: string): Promise<VerifyResult> {
    try {
      const response = await api.post(NFT_SERVER.VERIFY.replace(':tokenId', tokenId));
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  async revokeNFT(tokenId: string): Promise<{ message?: string; error?: string }> {
    try {
      const response = await api.post(NFT_SERVER.REVOKE.replace(':tokenId', tokenId));
      return response.data;
    } catch (error: any) {
      return { error: error.response?.data?.error || error.message };
    }
  }

  async verifyBatchNFTs(tokenIds: string[]): Promise<any> {
    try {
      const response = await api.post(NFT_SERVER.VERIFY_BATCH, { token_ids: tokenIds });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  async getMetadataHash(tokenId: string): Promise<{ token_id: string; metadata_hash: string }> {
    try {
      const response = await api.get(NFT_SERVER.GET_METADATA_HASH.replace(':tokenId', tokenId));
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message);
    }
  }

  async batchUploadPDFs(files: File[]): Promise<{ success: boolean; data: Record<string, { url: string; hash: string }>; errors: Record<string, string> }> {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      const response = await api.post(NFT_SERVER.BATCH_UPLOAD, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error: any) {
      return { 
        success: false, 
        data: {}, 
        errors: { _general: error.response?.data?.error || error.message } 
      };
    }
  }
}

export const NFTService = new NFTServiceClass();