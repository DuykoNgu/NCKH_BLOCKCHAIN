import api from "@configs/axios.config";
import { BLOCK_SERVER } from "../constants/api";

export interface BlockInfo {
  block_id: string;
  index: number;
  block_hash: string;
  validator_pubkey: string;
  validator_signature?: string;
  pre_hash?: string;
  merkle_root?: string;
  timestamp?: number;
  transactions_count: number;
}

class BlockServiceClass {
  async getAllBlocks(page = 1, pageSize = 20): Promise<{
    success: boolean;
    total_count: number;
    page: number;
    page_size: number;
    blocks: BlockInfo[];
  }> {
    const response = await api.get(BLOCK_SERVER.GET_ALL, {
      params: { page, page_size: pageSize },
    });
    return response.data;
  }

  async getLatestBlock(): Promise<{ success: boolean; block: BlockInfo }> {
    const response = await api.get(BLOCK_SERVER.GET_LATEST);
    return response.data;
  }

  async getBlockById(
    blockId: string
  ): Promise<{ success: boolean; block: BlockInfo }> {
    const response = await api.get(
      BLOCK_SERVER.GET_BY_ID.replace(":blockId", blockId)
    );
    return response.data;
  }

  async countBlocks(): Promise<{ success: boolean; total_blocks: number }> {
    const response = await api.get(BLOCK_SERVER.COUNT);
    return response.data;
  }
}

export const BlockService = new BlockServiceClass();
