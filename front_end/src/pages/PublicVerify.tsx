import { Shield, Search, CheckCircle, XCircle, Loader2, ArrowLeft, FileText, Copy, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useVerify } from '@/hooks';
import { truncateHash } from '@/utils/formatUtils';

const Scene3D = lazy(() => import('@/components/common/Scene3D'));

const PublicVerify = () => {
  const { query: tokenId, setQuery: setTokenId, loading: isVerifying, nft, verifyResult, handleVerify } = useVerify();
  const navigate = useNavigate();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép vào bộ nhớ tạm');
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
                  className="pl-10 bg-white/5 border-white/10 font-mono text-black h-12"
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
                      <p className="text-xs text-slate-400 font-mono">{truncateHash(nft.token_id)}</p>
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
                    <p className="text-muted-foreground mb-1">Loại bằng cấp</p>
                    <p className="text-foreground font-medium">{nft.metadata?.degree_type || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Đơn vị cấp phát</p>
                    <p className="text-foreground font-medium">{nft.metadata?.institution_address || nft.metadata?.institution || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Ngày cấp</p>
                    <p className="text-foreground font-medium">
                      {nft.minted_at ? new Date(nft.minted_at * 1000).toLocaleDateString('vi-VN') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Trạng thái</p>
                    <p className={verifyResult?.is_revoked ? "text-destructive font-medium" : "text-green-500 font-medium"}>
                      {verifyResult?.is_revoked ? "Đã thu hồi" : "Đang hiệu lực"}
                    </p>
                  </div>
                </div>

                {/* Mã văn bằng - có thể sao chép để chia sẻ */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border group">
                  <div className="overflow-hidden">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Mã chứng chỉ (dùng để tra cứu)</p>
                    <p className="font-mono text-xs text-foreground truncate">{nft.token_id}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(nft.token_id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Copy className="w-3 h-3 text-muted-foreground" />
                  </Button>
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
