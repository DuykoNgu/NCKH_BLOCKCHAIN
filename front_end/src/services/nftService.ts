import api from "@configs/axios.config"
import { NFT_SERVER } from '../constants/api';

import type { NFT, CreateNFTRequest, VerifyResult } from '../types/nft';
export type { NFTMetadata, NFT, CreateNFTRequest, VerifyResult } from '../types/nft';

class NFTServiceClass {
  async createNFT(data: CreateNFTRequest): Promise<{ success: boolean; token_id?: string; nft?: NFT; error?: string }> {
    try {
      const response = await api.post(NFT_SERVER.CREATE, data);
      return response.data;
    } catch (error: unknown) {
      return { success: false, error: (error as { response?: { data?: { error?: string } } }).response?.data?.error || (error as Error).message };
    }
  }

  async getNFT(tokenId: string): Promise<{ nft: NFT } | { error: string }> {
    try {
      const response = await api.get(NFT_SERVER.GET_BY_ID.replace(':tokenId', tokenId));
      return response.data;
    } catch (error: unknown) {
      return { error: (error as { response?: { data?: { error?: string } } }).response?.data?.error || (error as Error).message };
    }
  }

  async getStudentNFTs(studentId: string): Promise<{ total: number; nfts: NFT[] }> {
    try {
      const response = await api.get(NFT_SERVER.GET_STUDENT_NFTS.replace(':studentId', studentId));
      return response.data;
    } catch (error: unknown) {
      throw (error as { response?: { data?: { error?: string } } }).response?.data?.error || (error as Error).message;
    }
  }

  async getUserNFTs(recipientAddress: string): Promise<{ total: number; nfts: NFT[] }> {
    try {
      const response = await api.get(NFT_SERVER.GET_USER_NFTS.replace(':recipientAddress', recipientAddress));
      return response.data;
    } catch (error: unknown) {
      throw (error as { response?: { data?: { error?: string } } }).response?.data?.error || (error as Error).message;
    }
  }

  async getAllNFTs(): Promise<{ total: number; nfts: NFT[] }> {
    try {
      const response = await api.get(NFT_SERVER.GET_ALL);
      return response.data;
    } catch (error: unknown) {
      throw (error as { response?: { data?: { error?: string } } }).response?.data?.error || (error as Error).message;
    }
  }

  async getNFTsByIssuer(issuerAddress: string): Promise<{total: number; nfts: NFT[]}>{
    try{
      const response = await api.get(NFT_SERVER.GET_BY_ISSUER.replace(':issuer_address', issuerAddress));
      return response.data;
    } catch (error: unknown) {
      throw (error as { response?: { data?: { error?: string } } }).response?.data?.error || (error as Error).message;
    }
    
  }

  async verifyNFT(tokenId: string): Promise<VerifyResult> {
    try {
      const response = await api.post(NFT_SERVER.VERIFY.replace(':tokenId', tokenId));
      return response.data;
    } catch (error: unknown) {
      throw (error as { response?: { data?: { error?: string } } }).response?.data?.error || (error as Error).message;
    }
  }

  async revokeNFT(tokenId: string): Promise<{ message?: string; error?: string }> {
    try {
      const response = await api.post(NFT_SERVER.REVOKE.replace(':tokenId', tokenId));
      return response.data;
    } catch (error: unknown) {
      return { error: (error as { response?: { data?: { error?: string } } }).response?.data?.error || (error as Error).message };
    }
  }

  async verifyBatchNFTs(tokenIds: string[]): Promise<unknown> {
    try {
      const response = await api.post(NFT_SERVER.VERIFY_BATCH, { token_ids: tokenIds });
      return response.data;
    } catch (error: unknown) {
      throw (error as { response?: { data?: { error?: string } } }).response?.data?.error || (error as Error).message;
    }
  }

  async getMetadataHash(tokenId: string): Promise<{ token_id: string; metadata_hash: string }> {
    try {
      const response = await api.get(NFT_SERVER.GET_METADATA_HASH.replace(':tokenId', tokenId));
      return response.data;
    } catch (error: unknown) {
      throw (error as { response?: { data?: { error?: string } } }).response?.data?.error || (error as Error).message;
    }
  }

  async batchUploadPDFs(files: File[]): Promise<{
    success: boolean;
    data: Record<string, { url: string; hash: string }>;
    errors: Record<string, string>;
    total_uploaded: number;
    total_failed: number;
  }> {
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));

      const response = await api.post(NFT_SERVER.BATCH_UPLOAD, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000, // 5 phút cho batch lớn
      });
      return response.data;
    } catch (error: unknown) {
      return {
        success: false,
        data: {},
        errors: { _general: (error as { response?: { data?: { error?: string } } }).response?.data?.error || (error as Error).message },
        total_uploaded: 0,
        total_failed: files.length,
      };
    }
  }
}

export const NFTService = new NFTServiceClass();