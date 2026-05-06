import { useState, useEffect, useMemo } from "react";
import { NFTService } from "@/services/nftService";
import type { NFT } from "@/services/nftService";
import { toast } from "sonner";

export function truncateHash(hash: string, start = 8, end = 6): string {
  if (!hash || hash.length <= start + end) return hash || '-';
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}

export function getNftStatus(nft: NFT): string {
  if (nft.is_valid === false) return "rejected";
  if (nft.issuer_signature) return "verified";
  return "pending";
}

export const useAdminDegrees = () => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [mintOpen, setMintOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nfts, setNfts] = useState<NFT[]>([]);

  useEffect(() => {
    const fetchNFTs = async () => {
      setLoading(true);
      try {
        const res = await NFTService.getAllNFTs();
        setNfts(res.nfts || []);
      } catch (err) {
        console.error("Failed to fetch NFTs:", err);
        toast.error("Không thể tải danh sách bằng cấp");
      } finally {
        setLoading(false);
      }
    };
    fetchNFTs();
  }, []);

  const degrees = useMemo(() => nfts.map((nft) => ({
    id: nft.token_id,
    tokenId: truncateHash(nft.token_id),
    name: nft.metadata?.degree_type || "Chứng chỉ số",
    degree: nft.metadata?.degree_type || "-",
    university: nft.metadata?.institution_address ? truncateHash(nft.metadata.institution_address) : "-",
    date: nft.minted_at ? new Date(nft.minted_at).toLocaleDateString("vi-VN") : "-",
    status: getNftStatus(nft),
    recipient_name: nft.metadata?.student_id || "-",
    metadata: nft.metadata,
    is_valid: nft.is_valid !== false,
  })), [nfts]);

  const filtered = useMemo(() => degrees.filter((d) => {
    const name = d.recipient_name || "";
    const degreeType = d.metadata?.degree_type || "";
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) || 
                      degreeType.toLowerCase().includes(search.toLowerCase());
    
    const matchStatus = filterStatus === "all" || d.status === filterStatus;
    
    return matchSearch && matchStatus;
  }), [degrees, search, filterStatus]);

  const handleMint = () => {
    toast.info("Tính năng Mint NFT cần được thực hiện qua API với chữ ký số");
    setMintOpen(false);
  };

  return {
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    mintOpen,
    setMintOpen,
    loading,
    nfts,
    degrees,
    filtered,
    handleMint
  };
};
