import { useState, useEffect } from "react";
import { NetworkService } from "@/services/networkService";
import type { NetworkStats } from "@/services/networkService";
import { BlockService } from "@/services/blockService";
import { NFTService } from "@/services/nftService";

export const useAdminContracts = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [blockCount, setBlockCount] = useState(0);
  const [nftCount, setNftCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, countRes, nftRes] = await Promise.allSettled([
          NetworkService.getNetworkStats(),
          BlockService.countBlocks(),
          NFTService.getAllNFTs(),
        ]);

        if (statsRes.status === "fulfilled") setStats(statsRes.value);
        if (countRes.status === "fulfilled") setBlockCount(countRes.value.total_blocks || 0);
        if (nftRes.status === "fulfilled") setNftCount(nftRes.value.total || 0);
      } catch (err) {
        console.error("Blockchain info fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const blockchainInfo = [
    ["Blockchain", "EduChain (Private PoA)"],
    ["Consensus", "Proof of Authority (Round-Robin)"],
    ["Slot Duration", `${stats?.slot_duration || 5} giây`],
    ["Cryptography", "ECDSA secp256k1 + SHA256"],
    ["Total Blocks", blockCount.toString()],
    ["Total NFTs", nftCount.toString()],
    ["Total Peers", stats?.total_peers?.toString() || "0"],
    ["Active Validators", stats?.validator_peers?.toString() || "0"],
    ["Whitelist", stats?.whitelist_enabled ? "Enabled" : "Disabled"],
    ["NTP Sync", stats?.is_time_synced ? "Synced" : "Not Synced"],
    ["NTP Offset", `${stats?.ntp_offset?.toFixed(3) || "0.000"}s`],
  ];

  const chainFeatures = [
    { name: "createGenesisBlock", type: "write" as const, params: "(super_validator_pubkey)", desc: "Khởi tạo block đầu tiên cho blockchain" },
    { name: "mineBlock", type: "write" as const, params: "(validator_pubkey, private_key)", desc: "Đào block mới từ mempool transactions" },
    { name: "addTransaction", type: "write" as const, params: "(tx_data)", desc: "Thêm giao dịch vào mempool" },
    { name: "mintNFT", type: "write" as const, params: "(issuer, metadata, recipient)", desc: "Tạo NFT bằng cấp mới" },
    { name: "verifyNFT", type: "read" as const, params: "(token_id)", desc: "Xác minh chữ ký NFT trên blockchain" },
    { name: "getBlock", type: "read" as const, params: "(block_id)", desc: "Lấy thông tin block theo ID" },
    { name: "getPeers", type: "read" as const, params: "()", desc: "Lấy danh sách peers trong mạng P2P" },
    { name: "getSlotInfo", type: "read" as const, params: "(total_validators)", desc: "Lấy thông tin slot consensus hiện tại" },
  ];

  return {
    loading,
    stats,
    blockCount,
    nftCount,
    blockchainInfo,
    chainFeatures
  };
};
