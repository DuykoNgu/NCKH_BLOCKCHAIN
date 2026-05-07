const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000/api/v1";

export interface DashboardStats {
  total_nfts: number;
  verified_nfts: number;
  pending_nfts: number;
  transactions_today: number;
  total_blocks: number;
  latest_block_hash: string;
  total_validators: number;
  pending_validators: number;
}

export interface NetworkInfo {
  name: string;
  status: string;
  gas_price: string;
}

export interface RecentNFT {
  id: string;
  name: string;
  degree: string;
  university: string;
  status: 'verified' | 'pending' | 'rejected';
  date: string;
}

export interface RecentTransaction {
  hash: string;
  type: string;
  time: string;
  gas: string;
}

export const adminService = {
  getStats: async (): Promise<{ stats: DashboardStats; network: NetworkInfo }> => {
    const response = await fetch(`${API_URL}/admin/stats`);
    if (!response.ok) throw new Error("Failed to fetch dashboard stats");
    return response.json();
  },

  getRecentActivities: async (): Promise<{ recent_nfts: RecentNFT[]; recent_transactions: RecentTransaction[] }> => {
    const response = await fetch(`${API_URL}/admin/recent-activities`);
    if (!response.ok) throw new Error("Failed to fetch recent activities");
    return response.json();
  },

  getAllNFTs: async () => {
    const response = await fetch(`${API_URL}/nft/all`);
    if (!response.ok) throw new Error("Failed to fetch all NFTs");
    return response.json();
  },

  getAllTransactions: async () => {
    const response = await fetch(`${API_URL}/transactions/all`);
    if (!response.ok) throw new Error("Failed to fetch all transactions");
    return response.json();
  },

  getPendingValidators: async () => {
    const response = await fetch(`${API_URL}/users/pending_validators`);
    if (!response.ok) throw new Error("Failed to fetch pending validators");
    return response.json();
  },

  approveValidator: async (address: string) => {
    const response = await fetch(`${API_URL}/users/approve_validator`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    if (!response.ok) throw new Error("Failed to approve validator");
    return response.json();
  },

  rejectValidator: async (address: string) => {
    const response = await fetch(`${API_URL}/users/reject_validator`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    if (!response.ok) throw new Error("Failed to reject validator");
    return response.json();
  },

  getValidators: async (all: boolean = false) => {
    const response = await fetch(`${API_URL}/users/pending_validators${all ? '?all=true' : ''}`);
    if (!response.ok) throw new Error("Failed to fetch validators");
    return response.json();
  },
};
