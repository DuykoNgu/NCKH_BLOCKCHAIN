import api from "@configs/axios.config";
import { NETWORK_SERVER, MONITOR_SERVER } from "../constants/api";

export interface PeerInfo {
  peer_id: string;
  ip_address: string;
  port: number;
  public_key: string;
  node_type: string;
  status: string;
  last_seen: number;
}

export interface NetworkStats {
  total_peers: number;
  active_peers: number;
  pending_peers: number;
  validator_peers: number;
  observer_peers: number;
  whitelist_enabled: boolean;
  slot_duration: number;
  ntp_offset: number;
  is_time_synced: boolean;
}

export interface SlotInfo {
  current_slot: number;
  leader_index: number;
  slot_duration: number;
  time_remaining_in_slot: number;
  current_timestamp: number;
}

export interface NodeStatus {
  name: string | null;
  role?: "moet" | "validator" | "observer";
  ip_address: string;
  port: number;
  public_key: string;
  address?: string;
  reachable: boolean;
  is_self: boolean;
  is_moet?: boolean;
  is_active?: boolean;
  in_authority_set?: boolean;
  validator_index?: number;
  blocks_mined?: number;
  mempool_size?: number;
  height?: number;
  tip_hash?: string;
  tip_timestamp?: number;
  known_peers?: number;
  uptime_seconds?: number;
  last_seen?: number;
}

export interface AuthorityMember {
  index: number;
  public_key: string;
  address: string;
  name: string | null;
  is_moet: boolean;
  is_leader: boolean;
}

export interface PendingValidator {
  public_key: string;
  ip_address: string;
  port: number;
  requested_at: number;
}

export interface NetworkOverview {
  nodes: NodeStatus[];
  authority_set: AuthorityMember[];
  pending_validators: PendingValidator[];
  consensus: {
    current_slot: number;
    leader_index: number;
    slot_duration: number;
    time_remaining_in_slot: number;
  };
  whitelist_enabled: boolean;
  recent_blocks: {
    index: number;
    block_hash: string;
    validator_pubkey: string;
    validator_name: string | null;
    tx_count: number;
    timestamp: number;
  }[];
}

class NetworkServiceClass {
  async getNetworkOverview(): Promise<NetworkOverview> {
    const response = await api.get(MONITOR_SERVER.NETWORK);
    return response.data.data;
  }

  async approveValidator(publicKey: string): Promise<{ success: boolean; tx_hash: string }> {
    const response = await api.post(MONITOR_SERVER.APPROVE_VALIDATOR, { public_key: publicKey });
    return response.data;
  }

  async removeValidator(publicKey: string): Promise<{ success: boolean; tx_hash: string }> {
    const response = await api.post(MONITOR_SERVER.REMOVE_VALIDATOR, { public_key: publicKey });
    return response.data;
  }

  async healthCheck(): Promise<any> {
    const response = await api.get(NETWORK_SERVER.HEALTH);
    return response.data;
  }

  async getPeers(): Promise<PeerInfo[]> {
    const response = await api.get(NETWORK_SERVER.PEERS);
    return response.data;
  }

  async getNetworkStats(): Promise<NetworkStats> {
    const response = await api.get(NETWORK_SERVER.STATS);
    return response.data;
  }

  async getSlotInfo(totalValidators = 3): Promise<SlotInfo> {
    const response = await api.get(NETWORK_SERVER.SLOT_INFO, {
      params: { total_validators: totalValidators },
    });
    return response.data;
  }

  async getPendingPeers(): Promise<PeerInfo[]> {
    const response = await api.get(NETWORK_SERVER.PENDING_PEERS);
    return response.data;
  }

  async approvePeer(
    peerId: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.post(
      NETWORK_SERVER.APPROVE_PEER.replace(":peerId", peerId)
    );
    return response.data;
  }

  async registerPeer(data: {
    ip_address: string;
    port: number;
    public_key: string;
    node_type: string;
    university_name: string;
    university_code: string;
    website: string;
    description: string;
  }): Promise<any> {
    const response = await api.post(NETWORK_SERVER.REGISTER_PEER, data);
    return response.data;
  }
}

export const NetworkService = new NetworkServiceClass();
