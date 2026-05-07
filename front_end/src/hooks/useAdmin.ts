import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NFTService } from "@/services/nftService";
import { TransactionService } from "@/services/transactionService";
import { BlockService } from "@/services/blockService";
import { NetworkService } from "@/services/networkService";
import { AccountService } from "@/services/accountService";
import { useAllNFTs } from "./useNFTs";
import { useAllTransactions } from "./useTransactions";
import type { AccountInfo } from "@/services/accountService";
import { toast } from "sonner";
import { Activity, Server, HardDrive } from "lucide-react";
import { truncateHash, truncateAddress, formatTimeAgo, getNftStatus } from "@/utils/formatUtils";
import { STORAGE_KEYS } from "@/constants/storage";
import { adminService } from "@/services/adminService";

// --- Base Stats Hook ---

export const useAdminStats = () => {
  const blockCountQuery = useQuery({
    queryKey: ["admin", "block-count"],
    queryFn: () => BlockService.countBlocks(),
  });

  const nftListQuery = useQuery({
    queryKey: ["admin", "nfts-all"],
    queryFn: () => NFTService.getAllNFTs(),
  });

  const networkStatsQuery = useQuery({
    queryKey: ["admin", "network-stats"],
    queryFn: () => NetworkService.getNetworkStats(),
  });

  return {
    loading: blockCountQuery.isLoading || nftListQuery.isLoading || networkStatsQuery.isLoading,
    blockCount: blockCountQuery.data?.total_blocks || 0,
    nftCount: nftListQuery.data?.total || 0,
    networkStats: networkStatsQuery.data || null,
    refresh: () => {
      blockCountQuery.refetch();
      nftListQuery.refetch();
      networkStatsQuery.refetch();
    }
  };
};

// --- Dashboard Hook ---

export const useAdminDashboard = () => {
  const stats = useAdminStats();
  
  const nftListQuery = useAllNFTs();
  const txListQuery = useAllTransactions();

  const latestBlockQuery = useQuery({
    queryKey: ["admin", "latest-block"],
    queryFn: () => BlockService.getLatestBlock(),
  });

  const walletAddress = localStorage.getItem(STORAGE_KEYS.ADDRESS) || "";
  const nfts = nftListQuery.data?.nfts || [];
  const transactions = txListQuery.data?.transactions || [];



  const recentDegrees = useMemo(() => nfts.slice(0, 5).map((nft) => ({
    id: truncateHash(nft.token_id, 6, 4),
    name: nft.metadata?.degree_type || "Chứng chỉ số",
    degree: nft.metadata?.degree_type || "-",
    university: nft.metadata?.institution_address ? truncateHash(nft.metadata.institution_address, 6, 4) : "-",
    date: nft.minted_at ? new Date(nft.minted_at).toLocaleDateString("vi-VN") : "-",
    status: nft.is_valid !== false ? "verified" : "rejected",
    recipient_name: nft.metadata?.student_id || "-",
    is_valid: nft.is_valid !== false,
  })), [nfts]);

  const recentTxs = useMemo(() => transactions.slice(0, 3).map((tx) => ({
    hash: truncateHash(tx.tx_hash || tx.tx_id, 6, 4),
    type: tx.payload?.op === "mint_nft" ? "Mint NFT" : tx.payload?.op || "Giao dịch",
    time: tx.timestamp ? formatTimeAgo(tx.timestamp) : "-",
  })), [transactions]);

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    toast.success("Đã sao chép địa chỉ ví!");
  };

  return {
    isLoading: nftListQuery.isLoading || txListQuery.isLoading || stats.loading,
    nftListQuery,
    txListQuery,
    latestBlockQuery,
    walletAddress,
    blockCount: stats.blockCount,
    latestBlockIndex: latestBlockQuery.data?.block ? `#${latestBlockQuery.data.block.index}` : "-",
    totalNfts: nfts.length,
    verifiedNfts: nfts.filter(n => n.is_valid !== false).length,
    pendingNfts: nfts.filter(n => n.is_valid === false).length,
    totalTxs: transactions.length,
    recentDegrees,
    recentTxs,
    copyAddress
  };
};

// --- Contracts Hook ---

export const useAdminContracts = () => {
  const { loading, networkStats, blockCount, nftCount } = useAdminStats();

  const blockchainInfo = [
    ["Blockchain", "EduChain (Private PoA)"],
    ["Consensus", "Proof of Authority (Round-Robin)"],
    ["Slot Duration", `${networkStats?.slot_duration || 5} giây`],
    ["Cryptography", "ECDSA secp256k1 + SHA256"],
    ["Total Blocks", blockCount.toString()],
    ["Total NFTs", nftCount.toString()],
    ["Total Peers", networkStats?.total_peers?.toString() || "0"],
    ["Active Validators", networkStats?.validator_peers?.toString() || "0"],
    ["Whitelist", networkStats?.whitelist_enabled ? "Enabled" : "Disabled"],
    ["NTP Sync", networkStats?.is_time_synced ? "Synced" : "Not Synced"],
    ["NTP Offset", `${networkStats?.ntp_offset?.toFixed(3) || "0.000"}s`],
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
    stats: networkStats,
    blockCount,
    nftCount,
    blockchainInfo,
    chainFeatures
  };
};

// --- Degrees Hook ---

export const useAdminDegrees = () => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [mintOpen, setMintOpen] = useState(false);
  
  const nftListQuery = useQuery({
    queryKey: ["admin", "nfts-all"],
    queryFn: () => NFTService.getAllNFTs(),
  });

  const nfts = nftListQuery.data?.nfts || [];

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
    loading: nftListQuery.isLoading,
    nfts,
    degrees,
    filtered,
    handleMint
  };
};

// --- Network Hook ---

export const useAdminNetwork = () => {
  const { blockCount, networkStats, loading: statsLoading } = useAdminStats();

  const peersQuery = useQuery({
    queryKey: ["admin", "peers"],
    queryFn: () => NetworkService.getPeers(),
    refetchInterval: 10000,
  });

  const slotInfoQuery = useQuery({
    queryKey: ["admin", "slot-info"],
    queryFn: () => NetworkService.getSlotInfo(),
    refetchInterval: 10000,
  });

  const recentBlocksQuery = useQuery({
    queryKey: ["admin", "recent-blocks"],
    queryFn: () => BlockService.getAllBlocks(1, 5),
    refetchInterval: 10000,
  });

  const peers = Array.isArray(peersQuery.data) ? peersQuery.data : [];
  const activePeersCount = peers.filter(p => p.status === "ACTIVE").length;

  const networkStatsDisplay = [
    { label: "Tổng Peers", value: networkStats?.total_peers?.toString() || peers.length.toString(), icon: Server, color: "text-primary" },
    { label: "Peers hoạt động", value: networkStats?.active_peers?.toString() || activePeersCount.toString(), icon: Activity, color: "text-green-400" },
    { label: "Validators", value: networkStats?.validator_peers?.toString() || "0", icon: Server, color: "text-blue-400" },
    { label: "Tổng Blocks", value: blockCount.toString(), icon: HardDrive, color: "text-accent" },
  ];

  return {
    loading: statsLoading || peersQuery.isLoading || slotInfoQuery.isLoading || recentBlocksQuery.isLoading,
    peers,
    stats: networkStats,
    slotInfo: slotInfoQuery.data || null,
    recentBlocks: recentBlocksQuery.data?.blocks || [],
    blockCount,
    activePeersCount,
    networkStatsDisplay
  };
};

// --- Students Hook ---

export interface StudentDisplay {
  address: string;
  name: string;
  org_name: string;
  role: string;
  is_active: boolean;
  nftCount: number;
}

export const useAdminStudents = () => {
  const [search, setSearch] = useState("");
  
  const accountsQuery = useQuery({
    queryKey: ["admin", "accounts-all"],
    queryFn: () => AccountService.getAllAccounts(),
  });

  const nftListQuery = useAllNFTs();
  
  const accounts = accountsQuery.data?.accounts || [];
  const allNfts = nftListQuery.data?.nfts || [];

  const students = useMemo(() => {
    return accounts.map((acc: AccountInfo) => {
      // Count NFTs where this user is the recipient
      const userNfts = allNfts.filter((n: any) => 
        n.recipient_address === acc.address || 
        n.metadata?.student_id === acc.address
      );
      
      return {
        address: acc.address,
        name: acc.full_name || truncateAddress(acc.address),
        org_name: acc.tax_id ? `Tổ chức (${acc.tax_id})` : "Cá nhân",
        role: acc.role,
        is_active: Boolean(acc.is_active),
        nftCount: userNfts.length,
      };
    });
  }, [accounts, allNfts]);

  const filtered = useMemo(() => students.filter((s: any) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.address.toLowerCase().includes(search.toLowerCase()) ||
    (s.org_name || "").toLowerCase().includes(search.toLowerCase())
  ), [students, search]);

  const totalNfts = useMemo(() => students.reduce((sum: number, s: any) => sum + s.nftCount, 0), [students]);
  const activeCount = useMemo(() => students.filter((s: any) => s.is_active).length, [students]);

  return {
    search,
    setSearch,
    loading: accountsQuery.isLoading || nftListQuery.isLoading,
    students,
    filtered,
    totalNfts,
    activeCount
  };
};

// --- Transactions Hook ---

export const useAdminTransactions = () => {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  
  const txListQuery = useQuery({
    queryKey: ["admin", "transactions-all"],
    queryFn: () => TransactionService.getAllTransactions(),
  });

  const transactions = txListQuery.data?.transactions || [];

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
    loading: txListQuery.isLoading,
    transactions,
    filtered,
    stats
  };
};

// --- Validators Hook (NEW & REFACTORED) ---

export const useAdminValidators = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const validatorsQuery = useQuery({
    queryKey: ["admin", "pending-validators"],
    queryFn: () => adminService.getValidators(false),
  });

  const approveMutation = useMutation({
    mutationFn: (address: string) => adminService.approveValidator(address),
    onSuccess: () => {
      toast.success("Đã phê duyệt trường thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin", "pending-validators"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "network-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "accounts-all"] });
    },
    onError: (err: any) => toast.error(err.message || "Phê duyệt thất bại"),
  });

  const rejectMutation = useMutation({
    mutationFn: (address: string) => adminService.rejectValidator(address),
    onSuccess: () => {
      toast.success("Đã từ chối và xoá yêu cầu!");
      queryClient.invalidateQueries({ queryKey: ["admin", "pending-validators"] });
    },
    onError: (err: any) => toast.error(err.message || "Từ chối thất bại"),
  });

  const validators = validatorsQuery.data?.data || [];
  
  const filtered = useMemo(() => validators.filter((v: any) => 
    v.org_name?.toLowerCase().includes(search.toLowerCase()) || 
    v.address?.toLowerCase().includes(search.toLowerCase())
  ), [validators, search]);

  return {
    search,
    setSearch,
    validators,
    filtered,
    loading: validatorsQuery.isLoading || approveMutation.isPending || rejectMutation.isPending,
    handleApprove: approveMutation.mutate,
    handleReject: rejectMutation.mutate,
    refresh: () => validatorsQuery.refetch()
  };
};
