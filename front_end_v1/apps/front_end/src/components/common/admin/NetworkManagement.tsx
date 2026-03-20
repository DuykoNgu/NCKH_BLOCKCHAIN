import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Server, XCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface Peer {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'pending' | 'rejected';
  reputation: number;
  joinedAt: string;
}

const mockPeers: Peer[] = [
  { id: '1', name: 'Đại học Bách Khoa', address: '0xabcd...1234', status: 'active', reputation: 98, joinedAt: '2024-01-15' },
  { id: '2', name: 'Đại học Quốc Gia', address: '0xefgh...5678', status: 'active', reputation: 95, joinedAt: '2024-02-10' },
  { id: '3', name: 'Đại học Kinh tế', address: '0xijkl...9012', status: 'pending', reputation: 0, joinedAt: '2024-03-20' },
];

export const NetworkManagement = () => {
  const [peers, setPeers] = useState<Peer[]>(mockPeers);

  const handleApprove = (id: string) => {
    setPeers(peers.map(p => p.id === id ? { ...p, status: 'active', reputation: 50 } : p));
  };

  const handleReject = (id: string) => {
    setPeers(peers.map(p => p.id === id ? { ...p, status: 'rejected' } : p));
  };

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Quản lý Mạng lưới</CardTitle>
              <CardDescription>Quản lý các đơn vị kiểm duyệt (Nodes)</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => {}}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Đơn vị</TableHead>
                <TableHead>Địa chỉ định danh</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Uy tín</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {peers.map((peer) => (
                <TableRow key={peer.id}>
                  <TableCell className="font-medium">{peer.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{peer.address}</TableCell>
                  <TableCell>
                    {peer.status === 'active' && (
                      <Badge className="bg-success/20 text-success border-success/30">Hoạt động</Badge>
                    )}
                    {peer.status === 'pending' && (
                      <Badge className="bg-warning/20 text-warning border-warning/30">Chờ duyệt</Badge>
                    )}
                    {peer.status === 'rejected' && (
                      <Badge className="bg-destructive/20 text-destructive border-destructive/30">Từ chối</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${peer.reputation}%` }}
                        />
                      </div>
                      <span className="text-xs">{peer.reputation}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {peer.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-success hover:bg-success/10"
                          onClick={() => handleApprove(peer.id)}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleReject(peer.id)}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    {peer.status !== 'pending' && (
                      <Badge variant="outline" className="text-[10px] opacity-50">N/A</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
