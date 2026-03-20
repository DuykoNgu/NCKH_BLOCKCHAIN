import { useState, useEffect } from 'react';
import { FileText, Shield, Copy, ExternalLink, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { NFTService } from '@/services/nftService';
import type { NFT, VerifyResult } from '@/services/nftService';
import { toast } from 'sonner';

interface NFTDetailProps {
  tokenId: string;
  onBack?: () => void;
}

export const NFTDetail = ({ tokenId, onBack }: NFTDetailProps) => {
  const { isAdmin, isUser } = useAuth();
  const [nft, setNft] = useState<NFT | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [metadataHash, setMetadataHash] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  useEffect(() => {
    fetchNFTDetails();
  }, [tokenId]);

  const fetchNFTDetails = async () => {
    setIsLoading(true);
    try {
      const response = await NFTService.getNFT(tokenId);
      if ('nft' in response) {
        setNft(response.nft);
        // Tự động xác minh ngay khi tải xong thông tin NFT
        const result = await NFTService.verifyNFT(tokenId);
        setVerifyResult(result);
      }

      try {
        const hashResponse = await NFTService.getMetadataHash(tokenId);
        setMetadataHash(hashResponse.metadata_hash);
      } catch (hashError) {
        console.error('Failed to fetch metadata hash:', hashError);
        setMetadataHash(null);
      }
    } catch (error) {
      console.error('Failed to fetch NFT details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const result = await NFTService.verifyNFT(tokenId);
      setVerifyResult(result);
      if (result.is_valid) {
        toast.success('Chứng chỉ hợp lệ!');
      } else {
        toast.error('Chứng chỉ không hợp lệ hoặc đã bị thu hồi');
      }
    } catch (error) {
      toast.error('Không thể xác minh chứng chỉ');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirm('Bạn có chắc chắn muốn thu hồi chứng chỉ này? Hành động này không thể hoàn tác.')) {
      return;
    }

    setIsRevoking(true);
    try {
      const result = await NFTService.revokeNFT(tokenId);
      if (result.message) {
        toast.success('Đã thu hồi chứng chỉ thành công');
        fetchNFTDetails();
      } else {
        toast.error(result.error || 'Không thể thu hồi chứng chỉ');
      }
    } catch (error) {
      toast.error('Không thể thu hồi chứng chỉ');
    } finally {
      setIsRevoking(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}`);
  };

  const formatAddress = (address: string) => {
    if (!address) return '-';
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-border/50">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!nft) {
    return (
      <Card className="glass-card border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="w-12 h-12 text-warning mb-4" />
          <p className="text-muted-foreground">Không tìm thấy NFT</p>
          {onBack && (
            <Button variant="outline" className="mt-4" onClick={onBack}>
              Quay lại
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Chi tiết Chứng chỉ số</CardTitle>
              <CardDescription className="font-mono text-xs">
                Mã số: {formatAddress(nft.token_id)}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metadata Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">ID Sinh viên</p>
            <p className="font-medium">{nft.metadata?.student_id || '-'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Loại bằng cấp</p>
            <p className="font-medium">{nft.metadata?.degree_type || '-'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Tổ chức phát hành</p>
            <p className="font-medium">{nft.metadata?.institution || '-'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Ngày cấp phát</p>
            <p className="font-medium">
              {nft.minted_at ? new Date(nft.minted_at).toLocaleDateString('vi-VN') : '-'}
            </p>
          </div>
        </div>

        <Separator />

        {/* Blockchain Info */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Bằng chứng Pháp lý (Blockchain)
          </h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="text-xs text-muted-foreground">Mã định danh duy nhất (UUID)</p>
                <p className="font-mono text-sm">{formatAddress(nft.token_id)}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(nft.token_id, 'Mã số')}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="text-xs text-muted-foreground">Địa chỉ người nhận</p>
                <p className="font-mono text-sm">{formatAddress(nft.recipient_address)}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(nft.recipient_address, 'Địa chỉ')}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="text-xs text-muted-foreground">Chữ ký số Đơn vị cấp phát</p>
                <p className="font-mono text-sm">{formatAddress(nft.issuer_pubkey)}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(nft.issuer_pubkey, 'Chữ ký')}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            {metadataHash && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="text-xs text-muted-foreground">Mã băm dữ liệu gốc (Integrity Hash)</p>
                  <p className="font-mono text-sm">{formatAddress(metadataHash)}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(metadataHash, 'Mã băm')}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* PDF Link */}
        {nft.metadata?.pdf_url && (
          <>
            <Separator />
            <div>
              <a
                href={nft.metadata.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Xem chứng chỉ PDF gốc
              </a>
            </div>
          </>
        )}

        {/* Verification Result */}
        {verifyResult && (
          <>
            <Separator />
            <div className={`p-4 rounded-lg ${verifyResult.is_valid ? 'bg-success/10 border border-success/30' : 'bg-destructive/10 border border-destructive/30'}`}>
              <div className="flex items-center gap-2 mb-2">
                {verifyResult.is_valid ? (
                  <CheckCircle className="w-5 h-5 text-success" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
                <span className={verifyResult.is_valid ? 'text-success font-medium' : 'text-destructive font-medium'}>
                  {verifyResult.is_valid ? 'Chữ ký hợp lệ' : 'Chữ ký không hợp lệ'}
                </span>
              </div>
              {verifyResult.is_revoked && (
                <p className="text-sm text-destructive">Chứng chỉ này đã bị thu hồi</p>
              )}
            </div>
          </>
        )}

        <Separator />

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Quay lại
            </Button>
          )}
          {!isUser && (
            <Button onClick={handleVerify} disabled={isVerifying}>
              {isVerifying ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Shield className="w-4 h-4 mr-2" />
              )}
              Xác minh chữ ký
            </Button>
          )}
          {isAdmin && nft.is_valid && (
            <Button variant="destructive" onClick={handleRevoke} disabled={isRevoking}>
              {isRevoking ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Thu hồi chứng chỉ
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
