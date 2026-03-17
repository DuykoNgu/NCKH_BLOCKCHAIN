import { motion } from "framer-motion";
import { FileCheck, Copy, ExternalLink, Shield, Code, Blocks, Activity, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { contractInfo, contractFunctions, contractEvents } from "@/types/mockData";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const copyAddr = () => { navigator.clipboard.writeText(contractInfo.address); toast.success("Đã sao chép địa chỉ contract!"); };

export default function Contracts() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h2 className="font-display text-2xl font-bold text-foreground">Smart Contract</h2>
        <p className="text-sm text-muted-foreground mt-1">Quản lý và tương tác với smart contract EduChain Vault</p>
      </motion.div>

      {/* Contract Header */}
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
                      <h3 className="font-display text-xl font-bold text-foreground">{contractInfo.name}</h3>
                      <Badge variant="outline" className="bg-green-400/10 text-green-400 border-green-400/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" />Verified
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{contractInfo.standard} • {contractInfo.network}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-primary bg-secondary/50 px-3 py-1 rounded-md">{contractInfo.address.slice(0, 10)}...{contractInfo.address.slice(-8)}</code>
                  <button onClick={copyAddr} className="text-muted-foreground hover:text-primary transition-colors"><Copy className="h-4 w-4" /></button>
                  <button className="text-muted-foreground hover:text-primary transition-colors"><ExternalLink className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-secondary/30 text-center">
                  <p className="text-2xl font-bold font-display gradient-text">{contractInfo.totalSupply}</p>
                  <p className="text-xs text-muted-foreground">Total Supply</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30 text-center">
                  <p className="text-sm font-mono text-primary">{contractInfo.compiler}</p>
                  <p className="text-xs text-muted-foreground">Compiler</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Contract Details Tabs */}
      <motion.div variants={item}>
        <Tabs defaultValue="functions" className="space-y-4">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="functions"><Code className="h-4 w-4 mr-2" />Functions</TabsTrigger>
            <TabsTrigger value="events"><Activity className="h-4 w-4 mr-2" />Events</TabsTrigger>
            <TabsTrigger value="info"><Shield className="h-4 w-4 mr-2" />Thông tin</TabsTrigger>
          </TabsList>

          <TabsContent value="functions">
            <Card className="glass-card">
              <CardHeader className="pb-3"><CardTitle className="font-display text-lg">Contract Functions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {contractFunctions.map((fn) => (
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
                    <Button variant="outline" size="sm" className="shrink-0 ml-3">
                      {fn.type === "read" ? "Query" : "Execute"}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card className="glass-card">
              <CardHeader className="pb-3"><CardTitle className="font-display text-lg">Contract Events</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {contractEvents.map((ev, i) => (
                  <div key={i} className="flex items-start justify-between p-3 rounded-lg bg-secondary/30">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Blocks className="h-4 w-4 text-primary" />
                        <code className="text-sm font-mono font-semibold text-foreground">{ev.name}</code>
                      </div>
                      <p className="text-xs font-mono text-muted-foreground">{ev.data}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono text-primary">{ev.block}</p>
                      <p className="text-xs text-muted-foreground">{ev.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="info">
            <Card className="glass-card">
              <CardHeader className="pb-3"><CardTitle className="font-display text-lg">Thông tin Contract</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  ["Contract Address", contractInfo.address],
                  ["Owner", contractInfo.owner],
                  ["Token Standard", contractInfo.standard],
                  ["Network", contractInfo.network],
                  ["Compiler", contractInfo.compiler],
                  ["Deployed", contractInfo.deployed],
                  ["Total Supply", contractInfo.totalSupply],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-mono text-foreground">{typeof value === "string" && value.startsWith("0x") ? `${value.slice(0, 10)}...${value.slice(-8)}` : value}</span>
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
