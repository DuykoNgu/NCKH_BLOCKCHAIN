import { useState } from 'react';
import { FileText, Send, Loader2, CheckCircle, AlertCircle, Key } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NFTService } from '@/services/nftService';
import { calculateHashHex, signData } from '@/utils/cryptoUtils';
import { decryptPrivateKey } from '@/utils/cryptoVault';

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
  const [password, setPassword] = useState('');
  
  const [formData, setFormData] = useState({
    issuer_id: '',
    student_id: '',
    degree_type: '',
    pdf_url: '',
    institution_address: '',
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
      // 1. Lấy Vault từ Storage để giải mã Private Key
      const vaultData = localStorage.getItem("vault");
      if (!vaultData) throw new Error("Không tìm thấy ví trên thiết bị này.");
      
      const vault = JSON.parse(vaultData);
      let privateKey: Uint8Array;
      
      try {
        privateKey = await decryptPrivateKey(vault, password);
      } catch (err) {
        throw new Error("Mật khẩu không chính xác.");
      }

      // 2. Tính toán Hash của dữ liệu bằng cấp (Mock pdf_hash từ URL nếu không có file thực tế)
      // Trong thực tế, nên hash nội dung file PDF. Ở đây ta hash URL + metadata.
      const pdf_hash = calculateHashHex(formData.pdf_url + formData.degree_type + formData.student_id);

      // 3. Chuẩn bị metadata để ký (Giống logic trong NFTmetadata.py của Backend)
      // Nội dung ký: degree_type + pdf_url + pdf_hash + institution_address
      const messageToSign = formData.degree_type + formData.pdf_url + pdf_hash + formData.institution_address;
      
      // 4. Thực hiện ký số
      const signature = await signData(messageToSign, privateKey);

      // 5. Gửi yêu cầu Mint lên Backend
      const requestData = {
        ...formData,
        pdf_hash,
        signature,
      };

      const response = await NFTService.createNFT(requestData);
      
      if (response.success) {
        setResult({
          success: true,
          message: 'Chứng chỉ số đã được cấp phát và ghi vào Blockchain thành công!',
          tokenId: response.token_id,
        });
        // Reset form (trừ password)
        setFormData({
          issuer_id: '',
          student_id: '',
          degree_type: '',
          pdf_url: '',
          institution_address: '',
          recipient_address: account,
        });
        setPassword('');
      } else {
        setResult({
          success: false,
          message: response.error || 'Có lỗi xảy ra khi cấp phát chứng chỉ',
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Không thể kết nối đến server',
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
            <CardTitle className="text-lg">Cấp phát Chứng chỉ số (Mint NFT)</CardTitle>
            <CardDescription>Dữ liệu sẽ được ký số bằng Private Key của bạn trước khi gửi lên Blockchain</CardDescription>
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
            <Label htmlFor="institution_address">Tổ chức/Trường (Địa chỉ)</Label>
            <Input
              id="institution_address"
              placeholder="VD: Harvard University"
              value={formData.institution_address}
              onChange={(e) => setFormData({ ...formData, institution_address: e.target.value })}
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
            <Label htmlFor="recipient_address">Địa chỉ ví Sinh viên</Label>
            <Input
              id="recipient_address"
              placeholder="0x..."
              value={formData.recipient_address}
              onChange={(e) => setFormData({ ...formData, recipient_address: e.target.value })}
              required
              className="bg-background/50 font-mono text-sm"
            />
          </div>

          <div className="pt-4 border-t border-border/30">
            <div className="space-y-2">
              <Label htmlFor="password" title="Cần mật khẩu để giải mã Private Key thực hiện ký số">Xác nhận bằng Mật khẩu ví</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Nhập mật khẩu ví của bạn"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background/50 pl-10"
                />
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                * Private Key sẽ được giải mã tạm thời để ký dữ liệu và không bao giờ rời khỏi trình duyệt.
              </p>
            </div>
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
                    Mã số chứng chỉ (Token ID): {result.tokenId}
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
                Đang xác thực và ký số...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Cấp phát Chứng chỉ (Sign & Mint)
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
