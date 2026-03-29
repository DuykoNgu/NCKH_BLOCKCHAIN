import { useState, useEffect } from 'react';
import { Award, RefreshCw, Eye, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NFTService } from '@/services/nftService';
import type { NFT } from '@/services/nftService';

interface MyNFTsProps {
  account: string;
  onSelectNFT?: (tokenId: string) => void;
}

export const MyNFTs = ({ account, onSelectNFT }: MyNFTsProps) => {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMyNFTs = async () => {
    setIsLoading(true);
    try {
      const response = await NFTService.getUserNFTs(account);
      setNfts(response.nfts || []);
    } catch (error) {
      console.error('Failed to fetch user NFTs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (account) {
      fetchMyNFTs();
    }
  }, [account]);

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl from-primary to-accent flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Chứng chỉ của tôi</CardTitle>
              <CardDescription>{nfts.length} chứng chỉ NFT</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchMyNFTs} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {nfts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {isLoading ? 'Đang tải...' : 'Bạn chưa có chứng chỉ NFT nào'}
          </div>
        ) : (
          <div className="space-y-3">
            {nfts.map((nft) => (
              <div
                key={nft.token_id}
                className="p-4 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onSelectNFT?.(nft.token_id)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{nft.metadata?.degree_type || 'Chứng chỉ'}</p>
                    <p className="text-sm text-muted-foreground">{nft.metadata?.institution}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {nft.token_id.slice(0, 16)}...
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {nft.is_valid ? (
                      <Badge className="bg-success/20 text-success border-success/30">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Hợp lệ
                      </Badge>
                    ) : (
                      <Badge className="bg-destructive/20 text-destructive border-destructive/30">
                        <XCircle className="w-3 h-3 mr-1" />
                        Thu hồi
                      </Badge>
                    )}
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      Xem
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};