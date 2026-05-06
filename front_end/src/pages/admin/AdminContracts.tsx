import { motion } from "framer-motion";
import { FileCheck, Shield, Blocks, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminContracts } from "@/hooks/useAdminContracts";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function BlockchainInfo() {
  const { loading, blockCount, nftCount, blockchainInfo, chainFeatures } = useAdminContracts();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Đang tải thông tin blockchain...</span>
      </div>
    );
  }

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
