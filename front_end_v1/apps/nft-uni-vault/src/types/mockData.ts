import { GraduationCap, Shield, Clock, Activity, Server, TrendingUp } from "lucide-react";
import type { DashboardStat, RecentDegree, RecentTransaction } from "./index";
import type { Node, NetworkStat, SyncHistoryItem } from "./index";
import type { Degree } from "./index";
import type { Student } from "./index";
import type { Transaction } from "./index";
import type { ContractInfo, ContractFunction, ContractEvent } from "./index";

// Dashboard Mock Data
export const dashboardStats: DashboardStat[] = [
  { label: "Tổng NFT phát hành", value: "1,247", icon: "GraduationCap", change: "+12%", color: "text-primary" },
  { label: "Đã xác thực", value: "1,189", icon: "Shield", change: "+8%", color: "text-green-400" },
  { label: "Đang chờ", value: "43", icon: "Clock", change: "-5%", color: "text-yellow-400" },
  { label: "Giao dịch hôm nay", value: "28", icon: "Activity", change: "+23%", color: "text-accent" },
];

export const recentDegrees: RecentDegree[] = [
  { id: "0x7a3b...f821", name: "Nguyễn Văn An", degree: "Cử nhân CNTT", university: "ĐH Bách Khoa", date: "2024-03-10", status: "verified" },
  { id: "0x9c2d...a193", name: "Trần Thị Bình", degree: "Thạc sĩ Kinh tế", university: "ĐH Kinh Tế", date: "2024-03-09", status: "verified" },
  { id: "0x4e1f...d547", name: "Lê Hoàng Cường", degree: "Cử nhân Luật", university: "ĐH Luật HN", date: "2024-03-09", status: "pending" },
  { id: "0x8b6a...c332", name: "Phạm Minh Đức", degree: "Kỹ sư Xây dựng", university: "ĐH Xây Dựng", date: "2024-03-08", status: "verified" },
  { id: "0x1d5e...b774", name: "Hoàng Thị E", degree: "Cử nhân Y khoa", university: "ĐH Y Hà Nội", date: "2024-03-08", status: "rejected" },
];

export const recentTransactions: RecentTransaction[] = [
  { hash: "0xabc...123", type: "Mint NFT", time: "2 phút trước", gas: "0.0021 ETH" },
  { hash: "0xdef...456", type: "Xác thực", time: "15 phút trước", gas: "0.0008 ETH" },
  { hash: "0x789...abc", type: "Mint NFT", time: "1 giờ trước", gas: "0.0019 ETH" },
];

// Network Mock Data
export const nodes: Node[] = [
  { id: "node-01", name: "Ethereum Mainnet", type: "Full Node", status: "active", uptime: "99.9%", latency: "12ms", blockNumber: 19412847, synced: true },
  { id: "node-02", name: "Archive Node", type: "Archive Node", status: "active", uptime: "99.5%", latency: "28ms", blockNumber: 19412847, synced: true },
  { id: "node-03", name: "Light Node", type: "Light Node", status: "active", uptime: "98.2%", latency: "8ms", blockNumber: 19412845, synced: true },
  { id: "node-04", name: "RPC Endpoint", type: "RPC Node", status: "active", uptime: "99.8%", latency: "5ms", blockNumber: 19412847, synced: true },
  { id: "node-05", name: "Backup Node", type: "Full Node", status: "maintenance", uptime: "95.0%", latency: "45ms", blockNumber: 19412820, synced: false },
];

export const networkStats: NetworkStat[] = [
  { label: "Tổng số node", value: "5", icon: "Server", color: "text-primary" },
  { label: "Node đang hoạt động", value: "4", icon: "Activity", color: "text-green-400" },
  { label: "Node đang bảo trì", value: "1", icon: "Server", color: "text-yellow-400" },
  { label: "Thời gian hoạt động TB", value: "98.5%", icon: "TrendingUp", color: "text-accent" },
];

export const syncHistory: SyncHistoryItem[] = [
  { time: "2 phút trước", block: "#19,412,847", txCount: 124, gasUsed: "0.012 ETH", status: "success" },
  { time: "5 phút trước", block: "#19,412,846", txCount: 98, gasUsed: "0.009 ETH", status: "success" },
  { time: "8 phút trước", block: "#19,412,845", txCount: 156, gasUsed: "0.015 ETH", status: "success" },
  { time: "12 phút trước", block: "#19,412,844", txCount: 87, gasUsed: "0.008 ETH", status: "success" },
  { time: "15 phút trước", block: "#19,412,843", txCount: 143, gasUsed: "0.014 ETH", status: "success" },
];

// Degrees Mock Data
export const degrees: Degree[] = [
  { id: "NFT-001", txHash: "0x7a3b...f821", name: "Nguyễn Văn An", degree: "Cử nhân CNTT", university: "ĐH Bách Khoa HN", date: "2024-03-10", status: "verified", tokenId: "#1247" },
  { id: "NFT-002", txHash: "0x9c2d...a193", name: "Trần Thị Bình", degree: "Thạc sĩ Kinh tế", university: "ĐH Kinh Tế", date: "2024-03-09", status: "verified", tokenId: "#1246" },
  { id: "NFT-003", txHash: "0x4e1f...d547", name: "Lê Hoàng Cường", degree: "Cử nhân Luật", university: "ĐH Luật HN", date: "2024-03-09", status: "pending", tokenId: "#1245" },
  { id: "NFT-004", txHash: "0x8b6a...c332", name: "Phạm Minh Đức", degree: "Kỹ sư Xây dựng", university: "ĐH Xây Dựng", date: "2024-03-08", status: "verified", tokenId: "#1244" },
  { id: "NFT-005", txHash: "0x1d5e...b774", name: "Hoàng Thị E", degree: "Cử nhân Y khoa", university: "ĐH Y Hà Nội", date: "2024-03-08", status: "rejected", tokenId: "#1243" },
  { id: "NFT-006", txHash: "0x2f6a...c885", name: "Vũ Văn F", degree: "Cử nhân Toán", university: "ĐH Quốc Gia", date: "2024-03-07", status: "verified", tokenId: "#1242" },
  { id: "NFT-007", txHash: "0x3g7b...d996", name: "Đặng Thị G", degree: "Thạc sĩ Luật", university: "ĐH Luật TP.HCM", date: "2024-03-07", status: "verified", tokenId: "#1241" },
  { id: "NFT-008", txHash: "0x4h8c...e007", name: "Bùi Văn H", degree: "Kỹ sư Điện", university: "ĐH Bách Khoa", date: "2024-03-06", status: "pending", tokenId: "#1240" },
];

// Students Mock Data
export const students: Student[] = [
  { id: "SV001", name: "Nguyễn Văn An", email: "an.nv@bkhn.edu.vn", phone: "0912345678", major: "Công nghệ thông tin", university: "ĐH Bách Khoa HN", year: "2020-2024", nftCount: 1, status: "graduated" },
  { id: "SV002", name: "Trần Thị Bình", email: "binh.tt@kt.edu.vn", phone: "0912345679", major: "Kinh tế", university: "ĐH Kinh Tế", year: "2022-2024", nftCount: 1, status: "graduated" },
  { id: "SV003", name: "Lê Hoàng Cường", email: "cuong.lh@law.edu.vn", phone: "0912345680", major: "Luật", university: "ĐH Luật HN", year: "2020-2024", nftCount: 0, status: "active" },
  { id: "SV004", name: "Phạm Minh Đức", email: "duc.pm@xd.edu.vn", phone: "0912345681", major: "Xây dựng", university: "ĐH Xây Dựng", year: "2019-2023", nftCount: 1, status: "graduated" },
  { id: "SV005", name: "Hoàng Thị E", email: "e.ht@yhn.edu.vn", phone: "0912345682", major: "Y khoa", university: "ĐH Y Hà Nội", year: "2018-2024", nftCount: 0, status: "suspended" },
  { id: "SV006", name: "Vũ Văn F", email: "f.vu@qgv.edu.vn", phone: "0912345683", major: "Toán", university: "ĐH Quốc Gia", year: "2021-2025", nftCount: 0, status: "active" },
  { id: "SV007", name: "Đặng Thị G", email: "g.dt@lcm.edu.vn", phone: "0912345684", major: "Luật", university: "ĐH Luật TP.HCM", year: "2022-2024", nftCount: 1, status: "graduated" },
  { id: "SV008", name: "Bùi Văn H", email: "h.bv@bk.edu.vn", phone: "0912345685", major: "Điện", university: "ĐH Bách Khoa", year: "2020-2024", nftCount: 0, status: "active" },
];

// Transactions Mock Data
export const transactions: Transaction[] = [
  { hash: "0xabc1...d234", type: "Mint NFT", from: "0x742d...2bD38", to: "0x1a2b...9f3e", gas: "0.0021 ETH", gasUsd: "$6.98", time: "2 phút trước", status: "success", block: "#19,412,847" },
  { hash: "0xdef2...e345", type: "Xác thực", from: "0x3c4d...5e6f", to: "0x742d...2bD38", gas: "0.0008 ETH", gasUsd: "$2.66", time: "15 phút trước", status: "success", block: "#19,412,846" },
  { hash: "0x7893...f456", type: "Chuyển NFT", from: "0x5a6b...7c8d", to: "0x9e0f...1a2b", gas: "0.0015 ETH", gasUsd: "$4.99", time: "1 giờ trước", status: "success", block: "#19,412,845" },
  { hash: "0x4b5c...g567", type: "Mint NFT", from: "0x742d...2bD38", to: "0x2c3d...4e5f", gas: "0.0023 ETH", gasUsd: "$7.65", time: "2 giờ trước", status: "success", block: "#19,412,844" },
  { hash: "0x6d7e...h678", type: "Xác thực", from: "0x8f9a...0b1c", to: "0x742d...2bD38", gas: "0.0009 ETH", gasUsd: "$3.00", time: "3 giờ trước", status: "failed", block: "#19,412,843" },
  { hash: "0x9a0b...i789", type: "Mint NFT", from: "0x742d...2bD38", to: "0x3d4e...5f6a", gas: "0.0020 ETH", gasUsd: "$6.66", time: "5 giờ trước", status: "success", block: "#19,412,842" },
  { hash: "0x1c2d...j890", type: "Chuyển NFT", from: "0x4e5f...6a7b", to: "0x7c8d...9e0f", gas: "0.0014 ETH", gasUsd: "$4.66", time: "1 ngày trước", status: "success", block: "#19,412,841" },
  { hash: "0x2d3e...k901", type: "Xác thực", from: "0x5f6a...7b8c", to: "0x742d...2bD38", gas: "0.0007 ETH", gasUsd: "$2.33", time: "1 ngày trước", status: "pending", block: "#19,412,840" },
];

// Contracts Mock Data
export const contractInfo: ContractInfo = {
  address: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
  name: "DegreeNFT",
  standard: "ERC-721",
  network: "Ethereum Mainnet",
  compiler: "Solidity",
  version: "0.8.19",
  gasUsed: "1,247,500",
  deployed: "2024-01-15",
  totalSupply: "1,247",
  owner: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD38",
  verified: true,
};

export const contractFunctions: ContractFunction[] = [
  { name: "mintDegree", type: "write", params: "(address to, string uri, string degreeHash)", desc: "Mint NFT bằng cấp mới cho sinh viên" },
  { name: "verifyDegree", type: "write", params: "(uint256 tokenId)", desc: "Xác thực bằng cấp NFT" },
  { name: "transferDegree", type: "write", params: "(address from, address to, uint256 tokenId)", desc: "Chuyển quyền sở hữu NFT bằng cấp" },
  { name: "getDegreeInfo", type: "read", params: "(uint256 tokenId)", desc: "Lấy thông tin bằng cấp theo tokenId" },
  { name: "getHolderDegrees", type: "read", params: "(address holder)", desc: "Lấy danh sách bằng cấp của một địa chỉ" },
  { name: "tokenURI", type: "read", params: "(uint256 tokenId)", desc: "Lấy URI metadata của NFT" },
];

export const contractEvents: ContractEvent[] = [
  { name: "DegreeMinted", block: "#19,412,847", time: "2 phút trước", data: "tokenId: 1247, to: 0x7a3b...f821" },
  { name: "DegreeVerified", block: "#19,412,846", time: "15 phút trước", data: "tokenId: 1246, verifiedBy: 0x742d...2bD38" },
  { name: "DegreeTransferred", block: "#19,412,845", time: "1 giờ trước", data: "tokenId: 1245, from: 0x5a6b...7c8d, to: 0x9e0f...1a2b" },
  { name: "DegreeMinted", block: "#19,412,844", time: "2 giờ trước", data: "tokenId: 1244, to: 0x2c3d...4e5f" },
  { name: "DegreeVerified", block: "#19,412,843", time: "3 giờ trước", data: "tokenId: 1243, verifiedBy: 0x742d...2bD38" },
];

// Export icon components map for dashboard stats
export const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  GraduationCap,
  Shield,
  Clock,
  Activity,
  Server,
  TrendingUp,
};

// Network info
export const networkInfo = {
  name: "Ethereum",
  gas: "23 Gwei",
  block: "#19,412,847",
};

// Admin wallet
export const adminWallet = {
  address: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD38",
  balance: "2.4521 ETH",
  balanceUsd: "$8,142.50",
};
