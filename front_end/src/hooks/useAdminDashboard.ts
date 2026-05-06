import { useState, useEffect, useMemo } from "react";
import { NFTService } from "@/services/nftService";
import type { NFT } from "@/services/nftService";
import { TransactionService } from "@/services/transactionService";
import type { TransactionInfo } from "@/services/transactionService";
import { BlockService } from "@/services/blockService";
import { toast } from "sonner";
import { GraduationCap, CheckCircle2, Clock, Activity } from "lucide-react";

export function truncateHash(hash: string, start = 6, end = 4): string {
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

export const useAdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);
  const [blockCount, setBlockCount] = useState(0);
  const [latestBlockIndex, setLatestBlockIndex] = useState<string>("-");

  const walletAddress = localStorage.getItem("address") || "";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [nftRes, txRes, blockCountRes, latestBlockRes] = await Promise.allSettled([
          NFTService.getAllNFTs(),
          TransactionService.getAllTransactions(),
          BlockService.countBlocks(),
          BlockService.getLatestBlock(),
        ]);

        if (nftRes.status === "fulfilled") setNfts(nftRes.value.nfts || []);
        if (txRes.status === "fulfilled") setTransactions(txRes.value.transactions || []);
        if (blockCountRes.status === "fulfilled") setBlockCount(blockCountRes.value.total_blocks || 0);
        if (latestBlockRes.status === "fulfilled" && latestBlockRes.value.block) {
          setLatestBlockIndex(`#${latestBlockRes.value.block.index}`);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const total = nfts.length;
    const verified = nfts.filter((n) => n.is_valid !== false).length;
    const pending = total - verified;
    const txCount = transactions.length;

    return [
      { label: "Tổng NFT phát hành", value: total.toLocaleString(), icon: GraduationCap, color: "text-primary" },
      { label: "Đã xác thực", value: verified.toLocaleString(), icon: CheckCircle2, color: "text-green-400" },
      { label: "Đang chờ / Đã thu hồi", value: pending.toLocaleString(), icon: Clock, color: "text-yellow-400" },
      { label: "Tổng giao dịch", value: txCount.toLocaleString(), icon: Activity, color: "text-accent" },
    ];
  }, [nfts, transactions]);

  const recentDegrees = useMemo(() => nfts.slice(0, 5).map((nft) => ({
    id: truncateHash(nft.token_id),
    name: nft.metadata?.degree_type || "Chứng chỉ số",
    degree: nft.metadata?.degree_type || "-",
    university: nft.metadata?.institution_address ? truncateHash(nft.metadata.institution_address) : "-",
    date: nft.minted_at ? new Date(nft.minted_at).toLocaleDateString("vi-VN") : "-",
    status: nft.is_valid !== false ? "verified" : "rejected",
  })), [nfts]);

  const recentTxs = useMemo(() => transactions.slice(0, 3).map((tx) => ({
    hash: truncateHash(tx.tx_hash || tx.tx_id),
    type: tx.payload?.op === "mint_nft" ? "Mint NFT" : tx.payload?.op || "Giao dịch",
    time: tx.timestamp ? formatTimeAgo(tx.timestamp) : "-",
  })), [transactions]);

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    toast.success("Đã sao chép địa chỉ ví!");
  };

  return {
    loading,
    walletAddress,
    blockCount,
    latestBlockIndex,
    stats,
    recentDegrees,
    recentTxs,
    copyAddress
  };
};
