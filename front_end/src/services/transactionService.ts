import api from "@configs/axios.config";
import { TRANSACTION_SERVER } from "../constants/api";

export interface TransactionInfo {
  tx_id: string;
  tx_hash: string;
  sender_address: string;
  sender_pubkey?: string;
  recipient_address: string;
  signature?: string;
  timestamp: number;
  payload: Record<string, any>;
  block_id?: string;
}

class TransactionServiceClass {
  async getAllTransactions(): Promise<{
    success: boolean;
    total: number;
    transactions: TransactionInfo[];
  }> {
    const response = await api.get(TRANSACTION_SERVER.GET_ALL);
    return response.data;
  }

  async getTransactionsByAddress(address: string): Promise<{
    success: boolean;
    address: string;
    total: number;
    transactions: TransactionInfo[];
  }> {
    const response = await api.get(
      TRANSACTION_SERVER.GET_BY_ADDRESS.replace(":address", address)
    );
    return response.data;
  }
}

export const TransactionService = new TransactionServiceClass();
