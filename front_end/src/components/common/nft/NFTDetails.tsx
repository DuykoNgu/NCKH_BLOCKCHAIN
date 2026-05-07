import { FileText, Shield, Copy, ExternalLink, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, useNFTDetail, useVerifyNFT, useMetadataHash, useRevokeNFT } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface NFTDetailProps {
  tokenId: string;
  onBack?: () => void;
}

export const NFTDetail = ({ tokenId, onBack }: NFTDetailProps) => {
  const { isAdmin, isUser } = useAuth();
  
  const { data: nft, isLoading, isError } = useNFTDetail(tokenId);
  const { data: verifyResult, isLoading: isVerifying, refetch: verify } = useVerifyNFT(tokenId);
  const { data: hashData } = useMetadataHash(tokenId);
  const revokeMutation = useRevokeNFT();

  const handleVerify = async () => {
    const result = await verify();
    if (result.data?.is_valid) {
      toast.success('Chứng chỉ hợp lệ!');
    } else {
      toast.error('Chứng chỉ không hợp lệ hoặc đã bị thu hồi');
    }
  };

  const handleRevoke = async () => {
    if (!confirm('Bạn có chắc chắn muốn thu hồi chứng chỉ này? Hành động này không thể hoàn tác.')) {
      return;
    }
    revokeMutation.mutate(tokenId);
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

  if (isError || !nft) {
    return (
      <Card className="glass-card border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="w-12 h-12 text-warning mb-4" />
          <p className="text-muted-foreground">{isError ? "Lỗi tải thông tin NFT" : "Không tìm thấy NFT"}</p>
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
        {/* Metadata Info - Friendly for all users */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Loại bằng cấp</p>
            <p className="font-medium">{nft.metadata?.degree_type || '-'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Đơn vị cấp phát</p>
            <p className="font-medium">{nft.metadata?.institution_address || nft.metadata?.institution || '-'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Ngày cấp phát</p>
            <p className="font-medium">
              {nft.minted_at ? new Date(nft.minted_at * 1000).toLocaleDateString('vi-VN') : '-'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Trạng thái</p>
            <p className={`font-medium ${nft.is_valid ? 'text-green-500' : 'text-destructive'}`}>
              {nft.is_valid ? 'Đang hiệu lực' : 'Đã thu hồi'}
            </p>
          </div>
        </div>

        {/* Mã văn bằng - Shown to all */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div>
            <p className="text-xs text-muted-foreground">Mã văn bằng</p>
            <p className="font-mono text-sm">{formatAddress(nft.token_id)}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(nft.token_id, 'Mã văn bằng')}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>

        {/* Blockchain Proof - Only shown to admin/validator */}
        {!isUser && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Thông tin xác thực kỹ thuật
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-xs text-muted-foreground">Địa chỉ ví người nhận</p>
                    <p className="font-mono text-sm">{formatAddress(nft.recipient_address || '-')}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(nft.recipient_address || '', 'Địa chỉ')}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-xs text-muted-foreground">Khoá công khai đơn vị cấp phát</p>
                    <p className="font-mono text-sm">{formatAddress(nft.issuer_pubkey)}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(nft.issuer_pubkey, 'Khóa công khai')}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                {hashData?.metadata_hash && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-xs text-muted-foreground">Mã xác thực tính toàn vẹn</p>
                      <p className="font-mono text-sm">{formatAddress(hashData.metadata_hash)}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(hashData.metadata_hash, 'Mã xác thực')}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

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
            <Button variant="destructive" onClick={handleRevoke} disabled={revokeMutation.isPending}>
              {revokeMutation.isPending ? (
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
