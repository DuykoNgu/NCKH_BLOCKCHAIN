import { useState } from 'react';
import { FileText, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NFTService } from '@/services/nftService';
import type { CreateNFTRequest } from '@/services/nftService';

interface NFTCreateProps {
  account: string;
}

const degreeTypes = [
  'Bachelor of Science',
  'Bachelor of Arts',
  'Master of Science',
  'Master of Arts',
  'Doctor of Philosophy',
  'Certificate of Completion',
  'Professional Certificate',
];

export const NFTCreate = ({ account }: NFTCreateProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; tokenId?: string } | null>(null);
  const [formData, setFormData] = useState<CreateNFTRequest>({
    issuer_id: '',
    student_id: '',
    degree_type: '',
    pdf_url: '',
    institution: '',
    recipient_address: account,
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes('pdf')) {
      clearPdfError();
      setSelectedFile(null);
      setFormData({ ...formData, pdf_url: '' });
      setPdfHash('');
      return;
    }
    const hash = '';
    setSelectedFile(file);

    // Calculate PDF hash
    try {
      const buffer = await file.arrayBuffer();
      const hash = await calculatePdfHash(buffer);
      setPdfHash(hash);
    } catch (error) {
      console.error('Failed to calculate PDF hash:', error);
      setResult({
        success: false,
        message: 'Lỗi tính toán hash PDF',
      });
      return;
    }

    // Auto upload when file selected
    try {
      clearPdfError();
      const url = await uploadPDF(file, {
        folder: 'nft-certificates',
        tags: ['nft', 'certificate'],
      });
      setFormData({ ...formData, pdf_url: url, pdf_hash: hash });
    } catch (error) {
      console.error('Upload PDF failed:', error);
      setSelectedFile(null);
      setPdfHash('');
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPdfHash('');
    setFormData({ ...formData, pdf_url: '', pdf_hash: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    clearPdfError();
  };
const sortObjectKeys = <T extends Record<string, unknown>>(obj: T): T => {
  const sortedObj = {} as T;
  const keys = Object.keys(obj).sort() as Array<keyof T>;

  keys.forEach((key) => {
    sortedObj[key] = obj[key];
  });

  return sortedObj;
};
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.pdf_url) {
      setResult({
        success: false,
        message: 'Vui lòng tải lên file PDF chứng chỉ',
      });
      return;
    }

    // Kiểm tra password đã được lưu từ lúc đăng nhập
    if (!hasPassword()) {
      setResult({
        success: false,
        message: 'Mật khẩu ví không tìm thấy. Vui lòng đăng nhập lại.',
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await NFTService.createNFT(formData);
      if (response.success) {
        setResult({
          success: true,
          message: 'Chứng chỉ số đã được cấp phát thành công!',
          tokenId: response.token_id,
        });
        // Reset form
        setFormData({
          issuer_id: '',
          student_id: '',
          degree_type: '',
          pdf_url: '',
          institution: '',
          recipient_address: account,
        });
      } else {
        setResult({
          success: false,
          message: response.error || 'Có lỗi xảy ra khi cấp phát chứng chỉ',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Không thể kết nối đến server',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl from-primary to-accent flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Cấp phát Chứng chỉ số</CardTitle>
            <CardDescription>Lưu trữ chứng chỉ mới lên hệ thống EduChain</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issuer_id">ID Người phát hành</Label>
              <Input
                id="issuer_id"
                placeholder="VD: teacher_001"
                value={formData.issuer_id}
                onChange={(e) => setFormData({ ...formData, issuer_id: e.target.value })}
                required
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student_id">ID Sinh viên</Label>
              <Input
                id="student_id"
                placeholder="VD: STU_001"
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                required
                className="bg-background/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="degree_type">Loại bằng cấp</Label>
            <Select
              value={formData.degree_type}
              onValueChange={(value) => setFormData({ ...formData, degree_type: value })}
            >
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Chọn loại bằng cấp" />
              </SelectTrigger>
              <SelectContent>
                {degreeTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="institution">Tổ chức/Trường</Label>
            <Input
              id="institution"
              placeholder="VD: Harvard University"
              value={formData.institution}
              onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
              required
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="institution_address">Địa chỉ ví tổ chức</Label>
            <Input
              id="institution_address"
              placeholder="0x..."
              value={formData.institution_address}
              onChange={(e) => setFormData({ ...formData, institution_address: e.target.value })}
              required
              className="bg-background/50 font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipient_address">Địa chỉ định danh người nhận</Label>
            <Input
              id="recipient_address"
              placeholder="0x..."
              value={formData.recipient_address}
              onChange={(e) => setFormData({ ...formData, recipient_address: e.target.value })}
              required
              className="bg-background/50 font-mono text-sm"
            />
          </div>

          {result && (
            <div
              className={`p-4 rounded-lg flex items-start gap-3 ${
                result.success
                  ? 'bg-success/10 border border-success/30'
                  : 'bg-destructive/10 border border-destructive/30'
              }`}
            >
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-success mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
              )}
              <div>
                <p className={result.success ? 'text-success' : 'text-destructive'}>
                  {result.message}
                </p>
                {result.tokenId && (
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    Mã số chứng chỉ: {result.tokenId}
                  </p>
                )}
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || !formData.pdf_url || pdfUploading}
            className="w-full from-primary to-accent hover:opacity-90"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang tạo...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Cấp phát Chứng chỉ
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
