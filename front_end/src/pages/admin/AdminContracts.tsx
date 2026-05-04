import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileCheck, Shield, Blocks, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NetworkService } from "@/services/networkService";
import { BlockService } from "@/services/blockService";
import { NFTService } from "@/services/nftService";
import type { NetworkStats } from "@/services/networkService";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function BlockchainInfo() {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Đang tải thông tin blockchain...</span>
      </div>
    );
  }

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

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h2 className="font-display text-2xl font-bold text-foreground">Blockchain Info</h2>
        <p className="text-sm text-muted-foreground mt-1">Thông tin cấu hình và trạng thái mạng EduChain</p>
      </motion.div>

      {/* Header Card */}
      <motion.div variants={item}>
        <Card className="gradient-border overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center glow-effect">
                    <FileCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-xl font-bold text-foreground">EduChain</h3>
                      <Badge variant="outline" className="bg-green-400/10 text-green-400 border-green-400/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" />Active
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Proof of Authority • Private Blockchain</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-secondary/30 text-center">
                  <p className="text-2xl font-bold font-display gradient-text">{blockCount}</p>
                  <p className="text-xs text-muted-foreground">Blocks</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30 text-center">
                  <p className="text-2xl font-bold font-display gradient-text">{nftCount}</p>
                  <p className="text-xs text-muted-foreground">NFTs</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={item}>
        <Tabs defaultValue="functions" className="space-y-4">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="functions"><Blocks className="h-4 w-4 mr-2" />API Functions</TabsTrigger>
            <TabsTrigger value="info"><Shield className="h-4 w-4 mr-2" />Thông tin</TabsTrigger>
          </TabsList>

          <TabsContent value="functions">
            <Card className="glass-card">
              <CardHeader className="pb-3"><CardTitle className="font-display text-lg">Blockchain API Functions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {chainFeatures.map((fn) => (
                  <div key={fn.name} className="flex items-start justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm font-mono font-semibold text-foreground">{fn.name}</code>
                        <Badge variant="outline" className={fn.type === "read" ? "bg-primary/10 text-primary border-primary/20 text-xs" : "bg-accent/10 text-accent border-accent/20 text-xs"}>
                          {fn.type}
                        </Badge>
                      </div>
                      <code className="text-xs text-muted-foreground font-mono">{fn.params}</code>
                      <p className="text-xs text-muted-foreground mt-1">{fn.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="info">
            <Card className="glass-card">
              <CardHeader className="pb-3"><CardTitle className="font-display text-lg">Thông tin Blockchain</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {blockchainInfo.map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-mono text-foreground">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
