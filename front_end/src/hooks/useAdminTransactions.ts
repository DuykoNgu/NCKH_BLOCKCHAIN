import { useState, useEffect, useMemo } from "react";
import { TransactionService } from "@/services/transactionService";
import type { TransactionInfo } from "@/services/transactionService";

export function truncateHash(hash: string, start = 8, end = 6): string {
  if (!hash || hash.length <= start + end) return hash || '-';
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}

export function formatTimeAgo(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  if (diff < 60) return `${Math.floor(diff)} giây trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

export function getOpLabel(op: string): string {
  const labels: Record<string, string> = {
    mint_nft: "Mint NFT",
    verify: "Xác thực",
    transfer: "Chuyển NFT",
    revoke: "Thu hồi",
  };
  return labels[op] || op || "Giao dịch";
}

export const useAdminTransactions = () => {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);

  useEffect(() => {
    const fetchTx = async () => {
      setLoading(true);
      try {
        const res = await TransactionService.getAllTransactions();
        setTransactions(res.transactions || []);
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTx();
  }, []);

  const filtered = useMemo(() => transactions.filter((tx) => {
    const opType = tx.payload?.op || "";
    const matchSearch =
      (tx.tx_hash || "").toLowerCase().includes(search.toLowerCase()) ||
      (tx.tx_id || "").toLowerCase().includes(search.toLowerCase()) ||
      opType.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || opType === filterType;
    return matchSearch && matchType;
  }), [transactions, search, filterType]);

  const stats = useMemo(() => ({
    total: transactions.length,
    mintCount: transactions.filter(t => t.payload?.op === "mint_nft").length,
    otherCount: transactions.filter(t => t.payload?.op !== "mint_nft").length,
  }), [transactions]);

  return {
    search,
    setSearch,
    filterType,
    setFilterType,
    loading,
    transactions,
    filtered,
    stats
  };
};
