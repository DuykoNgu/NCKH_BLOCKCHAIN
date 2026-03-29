import { useState } from 'react';
import { Shield, Search, CheckCircle, XCircle, Loader2, ArrowLeft, FileText, Copy, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { NFTService } from '@/services/nftService';
import type { NFT, VerifyResult } from '@/services/nftService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const Scene3D = lazy(() => import('@/components/common/Scene3D'));

const PublicVerify = () => {
  const [tokenId, setTokenId] = useState('');
  const [nft, setNft] = useState<NFT | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async () => {
    if (!tokenId.trim()) {
      toast.error('Vui lòng nhập Mã chứng chỉ');
      return;
    }

    setIsVerifying(true);
    setNft(null);
    setVerifyResult(null);

    try {
      // 1. Lấy thông tin NFT
      const response = await NFTService.getNFT(tokenId);
      if ('nft' in response) {
        setNft(response.nft);
        
        // 2. Xác minh chữ ký
        const result = await NFTService.verifyNFT(tokenId);
        setVerifyResult(result);
        
        if (result.is_valid && !result.is_revoked) {
          toast.success('Chứng chỉ hợp lệ!');
        } else if (result.is_revoked) {
          toast.warning('Chứng chỉ đã bị thu hồi');
        } else {
          toast.warning('Chứng chỉ không hợp lệ');
        }
      } else {
        toast.error('Không tìm thấy chứng chỉ với mã số này');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi truy vấn hệ thống');
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép vào bộ nhớ tạm');
  };

  const formatAddress = (address: string) => {
    if (!address) return '-';
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden p-4">
      {/* Background decoration - Bronze Drum */}
      <Suspense fallback={null}>
        <Scene3D />
      </Suspense>

      <div className="w-full max-w-2xl z-10 space-y-8 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/5 border border-primary/10 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Tra cứu Văn bằng Số</h1>
          <p className="text-muted-foreground">Xác thực tính pháp lý của chứng chỉ trên mạng lưới Blockchain</p>
        </div>

        <Card className="glass-card border-border shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl">Kiểm tra thông tin</CardTitle>
            <CardDescription>Nhập mã định danh duy nhất của chứng chỉ (Token ID)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Ví dụ: 0x123...abc"
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                  className="pl-10 bg-white/5 border-white/10 font-mono text-white h-12"
                />
              </div>
              <Button 
                onClick={handleVerify} 
                disabled={isVerifying}
                className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-medium"
              >
                {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Tra cứu'}
              </Button>
            </div>

            {nft && (
              <div className="space-y-6 animate-slide-up bg-white/5 p-6 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{nft.metadata?.degree_type || 'Chứng chỉ số'}</h4>
                      <p className="text-xs text-slate-400 font-mono">{formatAddress(nft.token_id)}</p>
                    </div>
                  </div>
                  {verifyResult?.is_valid ? (
                    <Badge className="bg-success/20 text-success border-success/30 px-3 py-1">
                      <CheckCircle className="w-3 h-3 mr-2" />
                      Hợp lệ
                    </Badge>
                  ) : (
                    <Badge className="bg-destructive/20 text-destructive border-destructive/30 px-3 py-1">
                      <XCircle className="w-3 h-3 mr-2" />
                      Không hợp lệ
                    </Badge>
                  )}
                </div>

                <Separator className="bg-white/10" />

                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Sinh viên</p>
                    <p className="text-foreground font-medium">{nft.metadata?.student_id || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Tổ chức phát hành</p>
                    <p className="text-foreground font-medium">{nft.metadata?.institution || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Ngày cấp</p>
                    <p className="text-foreground font-medium">
                      {nft.minted_at ? new Date(nft.minted_at).toLocaleDateString('vi-VN') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Trạng thái</p>
                    <p className={verifyResult?.is_revoked ? "text-destructive font-medium" : "text-success font-medium"}>
                      {verifyResult?.is_revoked ? "Đã thu hồi" : "Đang hiệu lực"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Bằng chứng Blockchain</p>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border group">
                            <div className="overflow-hidden">
                                <p className="text-[10px] text-muted-foreground mb-0.5">Địa chỉ người nhận</p>
                                <p className="font-mono text-xs text-foreground truncate">{nft.recipient_address}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(nft.recipient_address)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Copy className="w-3 h-3 text-muted-foreground" />
                            </Button>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border group">
                            <div className="overflow-hidden">
                                <p className="text-[10px] text-muted-foreground mb-0.5">Chữ ký số phát hành</p>
                                <p className="font-mono text-xs text-foreground truncate">{nft.issuer_pubkey}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(nft.issuer_pubkey)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Copy className="w-3 h-3 text-muted-foreground" />
                            </Button>
                        </div>
                    </div>
                </div>

                {nft.metadata?.pdf_url && (
                  <Button 
                    variant="outline" 
                    className="w-full border-border hover:bg-muted/50 text-foreground"
                    onClick={() => window.open(nft.metadata?.pdf_url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Xem bản gốc PDF
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center pt-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/login')}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại trang Đăng nhập
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PublicVerify;
