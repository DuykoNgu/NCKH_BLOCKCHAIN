import { useState, useEffect } from "react";
import { NetworkService } from "@/services/networkService";
import type { PeerInfo, NetworkStats, SlotInfo } from "@/services/networkService";
import { BlockService } from "@/services/blockService";
import type { BlockInfo } from "@/services/blockService";
import { Server, Activity, HardDrive } from "lucide-react";

export const useAdminNetwork = () => {
  const [loading, setLoading] = useState(true);
  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [slotInfo, setSlotInfo] = useState<SlotInfo | null>(null);
  const [recentBlocks, setRecentBlocks] = useState<BlockInfo[]>([]);
  const [blockCount, setBlockCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [peersRes, statsRes, slotRes, blocksRes, countRes] = await Promise.allSettled([
          NetworkService.getPeers(),
          NetworkService.getNetworkStats(),
          NetworkService.getSlotInfo(),
          BlockService.getAllBlocks(1, 5),
          BlockService.countBlocks(),
        ]);

        if (peersRes.status === "fulfilled") setPeers(Array.isArray(peersRes.value) ? peersRes.value : []);
        if (statsRes.status === "fulfilled") setStats(statsRes.value);
        if (slotRes.status === "fulfilled") setSlotInfo(slotRes.value);
        if (blocksRes.status === "fulfilled") setRecentBlocks(blocksRes.value.blocks || []);
        if (countRes.status === "fulfilled") setBlockCount(countRes.value.total_blocks || 0);
      } catch (err) {
        console.error("Network fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    
    // Auto-refresh every 10 seconds for real-time feel
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const activePeersCount = peers.filter(p => p.status === "ACTIVE").length;

  const networkStatsDisplay = [
    { label: "Tổng Peers", value: stats?.total_peers?.toString() || peers.length.toString(), icon: Server, color: "text-primary" },
    { label: "Peers hoạt động", value: stats?.active_peers?.toString() || activePeersCount.toString(), icon: Activity, color: "text-green-400" },
    { label: "Validators", value: stats?.validator_peers?.toString() || "0", icon: Server, color: "text-blue-400" },
    { label: "Tổng Blocks", value: blockCount.toString(), icon: HardDrive, color: "text-accent" },
  ];

  return {
    loading,
    peers,
    stats,
    slotInfo,
    recentBlocks,
    blockCount,
    activePeersCount,
    networkStatsDisplay
  };
};
