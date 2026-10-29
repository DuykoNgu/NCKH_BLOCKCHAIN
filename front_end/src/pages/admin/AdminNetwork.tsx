import { useState } from "react";
import { motion } from "framer-motion";
import {
  Network, Server, Activity, ShieldCheck, Clock, Crown, Zap, UserCheck, UserMinus,
  AlertTriangle, CheckCircle2, WifiOff, Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useAdminNetwork } from "@/hooks";
import { useAuth } from "@/hooks/useAuth";
import { NetworkPageSkeleton } from "@/components/admin/AdminSkeletons";
import { truncateHash, formatTimeAgo } from "@/utils/formatUtils";
import type { NodeStatus } from "@/services/networkService";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  moet: { label: "MOET", className: "bg-primary/10 text-primary border-primary/20" },
  validator: { label: "Validator", className: "bg-blue-400/10 text-blue-400 border-blue-400/20" },
  observer: { label: "Observer", className: "bg-secondary text-muted-foreground border-border" },
};

function formatUptime(seconds?: number) {
  if (seconds === undefined) return "-";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m ${seconds % 60}s`;
}

function nodeLabel(node: { name?: string | null; ip_address?: string; port?: number }) {
  return node.name || `${node.ip_address}:${node.port}`;
}

function validatorState(node: NodeStatus) {
  if (!node.reachable) return { label: "Không rõ", className: "bg-secondary text-muted-foreground border-border" };
  if (node.role === "observer") return { label: "Observer", className: "bg-secondary text-muted-foreground border-border" };
  if (!node.is_active) return { label: "Chưa kích hoạt", className: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" };
  if (!node.in_authority_set) return { label: "Chờ MOET duyệt", className: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" };
  return { label: "Đang tạo khối", className: "bg-green-400/10 text-green-400 border-green-400/20" };
}

type NodeCardProps = {
  node: NodeStatus;
  maxHeight: number;
  isForked: boolean;
  isLeader: boolean;
};

function NodeCard({ node, maxHeight, isForked, isLeader }: NodeCardProps) {
  const roleBadge = node.role ? ROLE_BADGE[node.role] : null;
  const state = validatorState(node);
  const behind = node.reachable && node.height !== undefined ? maxHeight - node.height : 0;
  const ring = isForked
    ? "ring-2 ring-red-400/60"
    : isLeader
      ? "ring-2 ring-green-400/60 shadow-[0_0_24px_-6px] shadow-green-400/50"
      : node.is_self
        ? "ring-1 ring-primary/40"
        : "";

  return (
    <div className={`w-60 shrink-0 rounded-xl border border-border bg-card p-3 text-left transition-shadow ${ring} ${node.reachable ? "" : "opacity-70"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full shrink-0 ${node.reachable ? "bg-green-400" : "bg-red-400"}`} />
            <span className="font-medium text-sm text-foreground truncate">{nodeLabel(node)}</span>
            {node.is_moet && <Crown className="h-3.5 w-3.5 text-primary shrink-0" />}
          </div>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{node.ip_address}:{node.port}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {roleBadge && <Badge variant="outline" className={`text-[10px] ${roleBadge.className}`}>{roleBadge.label}</Badge>}
          {node.is_self && <Badge variant="outline" className="text-[10px]">đang xem</Badge>}
        </div>
      </div>

      {node.reachable ? (
        <>
          <div className="mt-3 flex items-center justify-between">
            <span className="font-mono text-sm text-foreground">#{node.height}</span>
            <span className={`font-mono text-[11px] ${isForked ? "text-red-400" : "text-muted-foreground"}`}>
              {node.tip_hash ? truncateHash(node.tip_hash, 6, 4) : "-"}
            </span>
          </div>
          {isForked && <p className="text-[11px] text-red-400 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />lệch chain</p>}
          {!isForked && behind > 0 && <p className="text-[11px] text-yellow-400">chậm {behind} block</p>}
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge variant="outline" className={`text-[10px] ${state.className}`}>{state.label}</Badge>
            {isLeader && <Badge variant="outline" className="text-[10px] bg-green-400/10 text-green-400 border-green-400/20">Đang tới lượt</Badge>}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1 text-center">
            {[
              ["Đã tạo", node.blocks_mined ?? "-"],
              ["Mempool", node.mempool_size ?? "-"],
              ["Uptime", formatUptime(node.uptime_seconds)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md bg-secondary/50 py-1">
                <p className="font-mono text-xs text-foreground">{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-3 text-xs text-red-400 flex items-center gap-1">
          <WifiOff className="h-3 w-3" />
          Mất kết nối{node.last_seen ? ` · lần cuối ${formatTimeAgo(node.last_seen)}` : ""}
        </p>
      )}
    </div>
  );
}

function Branch({ children, active, broken, first, last }: {
  children: React.ReactNode; active: boolean; broken: boolean; first: boolean; last: boolean;
}) {
  const line = broken ? "border-red-400/60 border-dashed" : active ? "border-green-400" : "border-border";
  return (
    <div className="relative flex flex-col items-center px-3 pt-8">
      {!(first && last) && (
        <span className={`absolute top-0 border-t ${first ? "left-1/2 right-0" : last ? "left-0 right-1/2" : "left-0 right-0"} border-border`} />
      )}
      <span className={`absolute top-0 left-1/2 h-8 border-l-2 ${line}`} />
      {active && <span className="absolute top-6 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-green-400 animate-ping" />}
      {children}
    </div>
  );
}

function Tier({ label, nodes, render, isActive }: {
  label: string;
  nodes: NodeStatus[];
  render: (node: NodeStatus) => React.ReactNode;
  isActive: (node: NodeStatus) => boolean;
}) {
  if (nodes.length === 0) return null;
  return (
    <div className="flex flex-col items-center">
      <span className="h-6 border-l-2 border-border" />
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded-full border border-border bg-background">{label}</span>
      <div className="flex justify-center">
        {nodes.map((node, i) => (
          <Branch
            key={`${node.ip_address}:${node.port}:${node.public_key}`}
            active={isActive(node)}
            broken={!node.reachable}
            first={i === 0}
            last={i === nodes.length - 1}
          >
            {render(node)}
          </Branch>
        ))}
      </div>
    </div>
  );
}

export default function NetworkPage() {
  const { loading, error, overview, updatedAt, approveValidator, removeValidator, mutating } = useAdminNetwork();
  const { role } = useAuth();
  const [confirmRemove, setConfirmRemove] = useState<{ public_key: string; name: string } | null>(null);

  if (loading) return <NetworkPageSkeleton />;

  if (error || !overview) {
    return (
      <Card className="glass-card">
        <CardContent className="p-8 text-center space-y-2">
          <WifiOff className="h-8 w-8 mx-auto text-red-400" />
          <p className="font-medium text-foreground">Không kết nối được tới node</p>
          <p className="text-sm text-muted-foreground">Kiểm tra node backend đang chạy và VITE_API_URL trỏ đúng địa chỉ.</p>
        </CardContent>
      </Card>
    );
  }

  const { nodes, authority_set, pending_validators, consensus, recent_blocks, whitelist_enabled } = overview;
  const selfNode = nodes.find((n) => n.is_self);
  const online = nodes.filter((n) => n.reachable);
  const reference = online.find((n) => n.is_moet) || online.reduce((a, b) => ((b.height ?? -1) > (a.height ?? -1) ? b : a), online[0]);
  const maxHeight = Math.max(...online.map((n) => n.height ?? -1));
  const forked = online.filter((n) => n.height === reference?.height && n.tip_hash !== reference?.tip_hash);
  const leader = authority_set.find((a) => a.is_leader);
  const isLeaderNode = (node: NodeStatus) => !!leader && node.reachable && node.public_key === leader.public_key;
  const rootNode = nodes.find((n) => n.is_moet || n.role === "moet");
  const validatorNodes = nodes.filter((n) => n !== rootNode && n.role !== "observer");
  const observerNodes = nodes.filter((n) => n !== rootNode && n.role === "observer");
  const isAdmin = role === "moet" || role === "admin";
  const canManage = isAdmin && !!selfNode?.is_moet;
  const slotProgress = consensus.slot_duration
    ? 100 - (consensus.time_remaining_in_slot / consensus.slot_duration) * 100
    : 0;

  const health = forked.length > 0
    ? { label: `${forked.length} node lệch chain`, color: "text-red-400", dot: "bg-red-400", icon: AlertTriangle }
    : online.length < nodes.length
      ? { label: `${nodes.length - online.length} node mất kết nối`, color: "text-yellow-400", dot: "bg-yellow-400", icon: WifiOff }
      : { label: "Mạng đồng bộ", color: "text-green-400", dot: "bg-green-400", icon: CheckCircle2 };

  const stats = [
    { label: "Node trực tuyến", value: `${online.length}/${nodes.length}`, icon: Server, color: "text-primary" },
    { label: "Validator đang hoạt động", value: authority_set.length.toString(), icon: ShieldCheck, color: "text-green-400" },
    { label: "Chiều cao chain", value: `#${maxHeight}`, icon: Layers, color: "text-blue-400" },
    { label: "Chờ duyệt", value: pending_validators.length.toString(), icon: UserCheck, color: pending_validators.length ? "text-yellow-400" : "text-muted-foreground" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <Card className="gradient-border overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <Network className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-lg sm:text-xl font-bold text-foreground">Giám sát node</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Đang xem từ node <span className="text-foreground font-medium">{selfNode ? nodeLabel(selfNode) : "-"}</span>
                    {updatedAt ? ` · cập nhật ${formatTimeAgo(updatedAt / 1000)}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:ml-auto">
                <div className={`h-2.5 w-2.5 rounded-full ${health.dot} animate-pulse`} />
                <span className={`text-xs sm:text-sm font-medium ${health.color}`}>{health.label}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="glass-card">
            <CardContent className="p-4">
              <div className={`h-10 w-10 rounded-lg bg-secondary flex items-center justify-center mb-3 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="font-display text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <motion.div variants={item}>
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Server className="h-4 w-4 text-primary" />
                Sơ đồ mạng
              </CardTitle>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-4 border-t-2 border-green-400" />đang tới lượt</span>
                <span className="flex items-center gap-1"><span className="w-4 border-t-2 border-dashed border-red-400/60" />mất kết nối</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto pb-6">
            <div className="min-w-max mx-auto flex flex-col items-center">
              {rootNode ? (
                <NodeCard node={rootNode} maxHeight={maxHeight} isForked={forked.includes(rootNode)} isLeader={isLeaderNode(rootNode)} />
              ) : (
                <div className="w-60 rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  Chưa thấy node MOET
                </div>
              )}
              <Tier
                label="Trường đại học"
                nodes={validatorNodes}
                isActive={isLeaderNode}
                render={(node) => <NodeCard node={node} maxHeight={maxHeight} isForked={forked.includes(node)} isLeader={isLeaderNode(node)} />}
              />
              <Tier
                label="Observer"
                nodes={observerNodes}
                isActive={() => false}
                render={(node) => <NodeCard node={node} maxHeight={maxHeight} isForked={forked.includes(node)} isLeader={false} />}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item} className="lg:col-span-2 space-y-6">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Danh sách validator (theo lượt)
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {whitelist_enabled ? "Whitelist: duyệt theo danh sách" : "Tự động duyệt"}
                </Badge>
              </div>
              {isAdmin && !canManage && (
                <p className="text-xs text-muted-foreground">Mở trang quản trị trên node MOET để duyệt hoặc gỡ validator.</p>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {authority_set.map((member) => (
                <div key={member.public_key} className={`flex items-center justify-between gap-3 p-3 rounded-lg ${member.is_leader ? "bg-green-400/10 border border-green-400/20" : "bg-secondary/40"}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs text-muted-foreground w-6">#{member.index}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground flex items-center gap-2">
                        {member.name || "Node chưa kết nối"}
                        {member.is_moet && <Crown className="h-3.5 w-3.5 text-primary" />}
                        {member.is_leader && <Badge variant="outline" className="bg-green-400/10 text-green-400 border-green-400/20 text-[10px]">Đang tới lượt</Badge>}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono truncate">{truncateHash(member.address, 10, 6)}</p>
                    </div>
                  </div>
                  {canManage && !member.is_moet && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-400 border-red-400/30 hover:bg-red-400/10 shrink-0"
                      disabled={mutating}
                      onClick={() => setConfirmRemove({ public_key: member.public_key, name: member.name || truncateHash(member.address) })}
                    >
                      <UserMinus className="h-3.5 w-3.5 mr-1" />Gỡ
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" />
                Node chờ duyệt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pending_validators.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Không có node nào đang chờ duyệt</p>
              ) : (
                pending_validators.map((p) => {
                  const node = nodes.find((n) => n.public_key === p.public_key);
                  return (
                    <div key={p.public_key} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-yellow-400/5 border border-yellow-400/20">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{node?.name || `${p.ip_address}:${p.port}`}</p>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-mono">{truncateHash(p.public_key, 10, 6)}</span>
                          {p.requested_at ? ` · yêu cầu ${formatTimeAgo(p.requested_at)}` : ""}
                        </p>
                      </div>
                      {canManage && (
                        <Button size="sm" disabled={mutating} onClick={() => approveValidator(p.public_key)} className="shrink-0">
                          <UserCheck className="h-3.5 w-3.5 mr-1" />Duyệt
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} className="space-y-6">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Consensus PoA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-secondary/50">
                  <span className="text-xs text-muted-foreground">Slot hiện tại</span>
                  <p className="text-sm font-mono font-bold text-foreground">#{consensus.current_slot}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <span className="text-xs text-muted-foreground">Tới lượt</span>
                  <p className="text-sm font-bold text-green-400 truncate">{leader?.name || (leader ? `#${leader.index}` : "-")}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Slot {consensus.slot_duration}s</span>
                  <span>còn {consensus.time_remaining_in_slot.toFixed(1)}s</span>
                </div>
                <Progress value={slotProgress} className="h-1.5" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Block gần đây
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {recent_blocks.map((block) => (
                <div key={block.block_hash || block.index} className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="h-3 w-3 text-green-400 shrink-0" />
                    <span className="font-mono text-primary">#{block.index}</span>
                    <span className="text-muted-foreground truncate">{block.validator_name || truncateHash(block.validator_pubkey, 6, 4)}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-muted-foreground">
                    <span>{block.tx_count} tx</span>
                    <span>{formatTimeAgo(block.timestamp)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Dialog open={!!confirmRemove} onOpenChange={(open) => !open && setConfirmRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gỡ validator "{confirmRemove?.name}"?</DialogTitle>
            <DialogDescription>
              MOET sẽ ký giao dịch <code>validator_remove</code>. Sau khi vào block, node này không còn được tạo khối
              và sẽ không được tự động duyệt lại — muốn khôi phục phải duyệt thủ công.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRemove(null)}>Huỷ</Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                if (confirmRemove) removeValidator(confirmRemove.public_key);
                setConfirmRemove(null);
              }}
            >
              Gỡ validator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
