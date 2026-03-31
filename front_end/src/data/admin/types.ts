// Dashboard Types
export interface DashboardStat {
  label: string;
  value: string;
  icon: string;
  change: string;
  color: string;
}

export interface RecentDegree {
  id: string;
  name: string;
  degree: string;
  university: string;
  date: string;
  status: "verified" | "pending" | "rejected";
}

export interface RecentTransaction {
  hash: string;
  type: string;
  time: string;
  gas: string;
}

// Network Types
export interface Node {
  id: string;
  name: string;
  type: string;
  status: "active" | "maintenance" | "inactive";
  uptime: string;
  latency: string;
  blockNumber: number;
  synced: boolean;
}

export interface NetworkStat {
  label: string;
  value: string;
  icon: string;
  color: string;
}

export interface SyncHistoryItem {
  time: string;
  block: string;
  txCount: number;
  gasUsed: string;
  status: "success" | "failed";
}

// Degrees Types
export interface Degree {
  id: string;
  txHash: string;
  name: string;
  degree: string;
  university: string;
  date: string;
  status: "verified" | "pending" | "rejected";
  tokenId: string;
}

// Students Types
export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  major: string;
  university: string;
  year: string;
  nftCount: number;
  status: "active" | "graduated" | "suspended" | "studying";
}

// Transactions Types
export interface Transaction {
  hash: string;
  type: string;
  from: string;
  to: string;
  gas: string;
  gasUsd: string;
  time: string;
  status: "success" | "failed" | "pending";
  block: string;
}

// Contracts Types
export interface ContractInfo {
  address: string;
  name?: string;
  standard?: string;
  network: string;
  compiler?: string;
  version?: string;
  gasUsed?: string;
  deployed?: string;
  totalSupply?: string;
  owner?: string;
  verified?: boolean;
}

export interface ContractFunction {
  name: string;
  type: "read" | "write";
  params: string;
  desc: string;
}

export interface ContractEvent {
  name: string;
  block: string;
  time: string;
  data: string;
}

// Status Config Types
export interface StatusConfig {
  label: string;
  icon: string;
  className: string;
}
