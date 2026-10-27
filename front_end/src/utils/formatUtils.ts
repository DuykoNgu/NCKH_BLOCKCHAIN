import type { NFT } from "@/services/nftService";

export function truncateHash(hash: string, start = 8, end = 6): string {
  if (!hash || hash.length <= start + end) return hash || '-';
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}

export function truncateAddress(addr: string): string {
  return truncateHash(addr, 8, 6);
}

export function formatTimeAgo(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  if (diff < 60) return `${Math.floor(diff)} giây trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

export function getNftStatus(nft: NFT): "rejected" | "verified" | "pending" {
  if (nft.is_valid === false) return "rejected";
  if (nft.issuer_signature) return "verified";
  return "pending";
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
