import { useState, useMemo } from 'react';
import { Award, Search, RefreshCw, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAllNFTs } from '@/hooks';

interface NFTListProps {
  onSelectNFT?: (tokenId: string) => void;
}

export const NFTList = ({ onSelectNFT }: NFTListProps) => {
  const { data, isLoading, refetch } = useAllNFTs();
  const [searchTerm, setSearchTerm] = useState('');

  const nfts = data?.nfts || [];

  const filteredNfts = useMemo(() => {
    if (!searchTerm) return nfts;
    return nfts.filter(
      (nft) =>
        nft.token_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (nft.metadata?.student_id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (nft.metadata?.institution || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, nfts]);

  const formatAddress = (address: string) => {
    if (!address) return '-';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (date: string | number) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Danh sách Chứng chỉ số</CardTitle>
              <CardDescription>Tổng cộng: {nfts.length} chứng chỉ đã cấp</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo Mã chứng chỉ, Student ID, hoặc Tổ chức..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/50"
            />
          </div>
        </div>

        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Mã chứng chỉ</TableHead>
                <TableHead>Sinh viên</TableHead>
                <TableHead>Loại bằng</TableHead>
                <TableHead>Tổ chức</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNfts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {isLoading ? 'Đang tải...' : 'Không có NFT nào'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredNfts.map((nft) => (
                  <TableRow
                    key={nft.token_id}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => onSelectNFT?.(nft.token_id)}
                  >
                    <TableCell className="font-mono text-xs">
                      {formatAddress(nft.token_id)}
                    </TableCell>
                    <TableCell>{nft.metadata?.student_id || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {nft.metadata?.degree_type || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{nft.metadata?.institution || '-'}</TableCell>
                    <TableCell>
                      {nft.is_valid ? (
                        <Badge className="bg-success/20 text-success border-success/30">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Hợp lệ
                        </Badge>
                      ) : (
                        <Badge className="bg-destructive/20 text-destructive border-destructive/30">
                          <XCircle className="w-3 h-3 mr-1" />
                          Đã thu hồi
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {nft.minted_at ? formatDate(nft.minted_at) : '-'}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};