import { useState } from 'react';
import { Shield, Search, CheckCircle, XCircle, Loader2, Plus, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NFTService } from '@/services/nftService';
import type { VerifyResult } from '@/services/nftService';
import { toast } from 'sonner';

export const NFTVerify = () => {
  const [singleTokenId, setSingleTokenId] = useState('');
  const [batchTokenIds, setBatchTokenIds] = useState<string[]>(['']);
  const [singleResult, setSingleResult] = useState<VerifyResult | null>(null);
  const [batchResults, setBatchResults] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSingleVerify = async () => {
    if (!singleTokenId.trim()) {
      toast.error('Vui lòng nhập Mã chứng chỉ');
      return;
    }

    setIsVerifying(true);
    setSingleResult(null);

    try {
      const result = await NFTService.verifyNFT(singleTokenId);
      setSingleResult(result);
      if (result.is_valid && !result.is_revoked) {
        toast.success('Chứng chỉ hợp lệ!');
      } else if (result.is_revoked) {
        toast.warning('Chứng chỉ đã bị thu hồi');
      } else {
        toast.warning('Chứng chỉ không hợp lệ');
      }
    } catch (error) {
      toast.error('Không thể xác minh chứng chỉ');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBatchVerify = async () => {
    const validIds = batchTokenIds.filter((id) => id.trim());
    if (validIds.length === 0) {
      toast.error('Vui lòng nhập ít nhất một Mã chứng chỉ');
      return;
    }

    setIsVerifying(true);
    setBatchResults(null);

    try {
      const results = await NFTService.verifyBatchNFTs(validIds);
      setBatchResults(results);
      toast.success(`Đã xác minh ${validIds.length} chứng chỉ`);
    } catch (error) {
      toast.error('Không thể xác minh các chứng chỉ');
    } finally {
      setIsVerifying(false);
    }
  };

  const addBatchInput = () => {
    if (batchTokenIds.length < 100) {
      setBatchTokenIds([...batchTokenIds, '']);
    }
  };

  const removeBatchInput = (index: number) => {
    if (batchTokenIds.length > 1) {
      setBatchTokenIds(batchTokenIds.filter((_, i) => i !== index));
    }
  };

  const updateBatchInput = (index: number, value: string) => {
    const updated = [...batchTokenIds];
    updated[index] = value;
    setBatchTokenIds(updated);
  };

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Xác nhận Chứng chỉ số</CardTitle>
            <CardDescription>Kiểm tra tính pháp lý của chứng chỉ trên hệ thống</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="single">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="single">Xác minh đơn</TabsTrigger>
            <TabsTrigger value="batch">Xác minh hàng loạt</TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nhập Mã chứng chỉ..."
                value={singleTokenId}
                onChange={(e) => setSingleTokenId(e.target.value)}
                className="bg-background/50 font-mono"
              />
              <Button onClick={handleSingleVerify} disabled={isVerifying}>
                {isVerifying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>

            {singleResult && (
              <div
                className={`p-4 rounded-lg ${
                  singleResult.is_valid && !singleResult.is_revoked
                    ? 'bg-green-500/10 border border-green-500/30'
                    : 'bg-destructive/10 border border-destructive/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  {singleResult.is_valid && !singleResult.is_revoked ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : (
                    <XCircle className="w-8 h-8 text-destructive" />
                  )}
                  <div>
                    <p
                      className={`font-medium ${
                        singleResult.is_valid && !singleResult.is_revoked
                          ? 'text-green-600'
                          : 'text-destructive'
                      }`}
                    >
                      {singleResult.is_valid && !singleResult.is_revoked
                        ? 'Chứng chỉ hợp lệ'
                        : 'Chứng chỉ không hợp lệ'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Mã số: {singleResult.token_id.slice(0, 20)}...
                    </p>
                    {singleResult.is_revoked && (
                      <Badge variant="destructive" className="mt-2">
                        Đã thu hồi
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="batch" className="space-y-4">
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {batchTokenIds.map((id, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Mã chứng chỉ ${index + 1}`}
                    value={id}
                    onChange={(e) => updateBatchInput(index, e.target.value)}
                    className="bg-background/50 font-mono text-sm"
                  />
                  {batchTokenIds.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeBatchInput(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={addBatchInput} className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                Thêm Mã chứng chỉ
              </Button>
              <Button onClick={handleBatchVerify} disabled={isVerifying} className="flex-1">
                {isVerifying ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4 mr-2" />
                )}
                Xác minh tất cả
              </Button>
            </div>

            {batchResults && (
              <div className="space-y-2 mt-4">
                <p className="text-sm font-medium">Kết quả xác minh:</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {batchResults.results?.map((result: any, index: number) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg flex items-center justify-between ${
                        result.is_valid ? 'bg-success/10' : 'bg-destructive/10'
                      }`}
                    >
                      <span className="font-mono text-xs">
                        {result.token_id?.slice(0, 20)}...
                      </span>
                      {result.is_valid ? (
                        <Badge className="bg-green-500/20 text-green-600 hover:bg-green-500/30 border-none">Hợp lệ</Badge>
                      ) : (
                        <Badge variant="destructive">Không hợp lệ</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
