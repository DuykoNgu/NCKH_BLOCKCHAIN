import { useState, useRef } from 'react';
import { FileText, Send, Loader2, CheckCircle, AlertCircle, Upload, File, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NFTService } from '@/services/nftService';
import { useStorage } from '@/hooks/useStorage';
import { usePassword } from '@/hooks/usePassword';
import { calculatePdfHash, signDataWithBytes } from '@/utils/signatureUtils';
import { decryptPrivateKey } from '@/utils/cryptoVault';
import { NFTBatchCreate } from './NFTBatchCreate';
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
  const { uploading: pdfUploading, error: pdfError, uploadPDF, clearError: clearPdfError } = useStorage();
  const { getPassword, hasPassword } = usePassword();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfHash, setPdfHash] = useState<string>('');
  const fullname = localStorage.getItem('full_name') || 'Người dùng';
  const [formData, setFormData] = useState<CreateNFTRequest>({
    student_id: '',
    degree_type: '',
    pdf_url: '',
    pdf_hash: '',
    institution: fullname,
    institution_address: account,
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
      // Lấy password từ session storage
      const password = getPassword();
      console.log('Password : ', password);
      if (!password) {
        throw new Error('Mật khẩu ví không tìm thấy');
      }

      // Get private key from vault using password
      const vault = localStorage.getItem('vault');
      if (!vault) {
        throw new Error('Không tìm thấy ví trong hệ thống');
      }

      const vaultData = JSON.parse(vault);
      const privateKeyBytes = await decryptPrivateKey(vaultData, password);

      // Create signing data with current timestamp
      const issuedAt = Math.floor(Date.now() / 1000); // seconds


      // Trong handleSubmit, hãy sửa lại đoạn tạo signingData:
      const signingMetadata = {
        degree_type: formData.degree_type,
        pdf_url: formData.pdf_url,
        pdf_hash: formData.pdf_hash,
        institution_address: formData.institution_address,
        issued_at: issuedAt,
      };


      const sortedMetadata = sortObjectKeys(signingMetadata);

      const signingData = JSON.stringify(sortedMetadata);
      console.log('Signing data:', signingData);

      // Sign the data
      const signature = signDataWithBytes(signingData, privateKeyBytes);
      console.log('Signature generated:', signature);

      // Prepare request with signature
      const requestData = {
        ...formData,
        issued_at: issuedAt,
        signature: signature,
        institution: formData.institution,
        student_id: formData.student_id,
      };

      console.log('Request data:', requestData);

      const response = await NFTService.createNFT(requestData);
      if (response.success) {
        setResult({
          success: true,
          message: 'Chứng chỉ số đã được cấp phát thành công!',
          tokenId: response.token_id,
        });
        // Reset form
        setFormData({
          student_id: '',
          degree_type: '',
          pdf_url: '',
          pdf_hash: '',
          institution: fullname,
          institution_address: account,
          recipient_address: '',
        });
        setSelectedFile(null);
        setPdfHash('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setResult({
          success: false,
          message: response.error || 'Có lỗi xảy ra khi cấp phát chứng chỉ',
        });
      }
    } catch (error: unknown) {
      let errorMessage = 'Có lỗi không xác định xảy ra';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      console.error('NFT creation error:', error);
      setResult({
        success: false,
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tabs defaultValue="single" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="single">Cấp phát đơn lẻ</TabsTrigger>
        <TabsTrigger value="batch">Cấp phát hàng loạt</TabsTrigger>
      </TabsList>

      <TabsContent value="single">
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
                <div className="space-y-2 ">
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
              </div>


              <div className="space-y-2">
                <Label htmlFor="institution">Tổ chức/Trường</Label>
                <Input
                  id="institution"
                  value={formData.institution}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="institution_address">Địa chỉ ví tổ chức</Label>
                <Input
                  id="institution_address"
                  value={formData.institution_address}
                  readOnly
                  className="bg-muted cursor-not-allowed"
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
              <div className="space-y-2">
                <Label htmlFor="pdf_file">Upload Chứng chỉ (PDF)</Label>
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    id="pdf_file"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    disabled={pdfUploading}
                    className="hidden"
                  />

                  {!selectedFile && !formData.pdf_url ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={pdfUploading}
                      className="w-full p-4 border-2 border-dashed border-border/50 rounded-lg hover:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-2 bg-background/30"
                    >
                      {pdfUploading ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">Đang tải lên...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-muted-foreground" />
                          <div className="text-center">
                            <p className="text-sm font-medium">Chọn file PDF để tải lên</p>
                            <p className="text-xs text-muted-foreground">hoặc kéo thả file vào đây</p>
                          </div>
                        </>
                      )}
                    </button>
                  ) : formData.pdf_url ? (
                    <div className="p-4 rounded-lg bg-success/10 border border-success/30 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-success" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-success">Upload thành công</p>
                          <p className="text-xs text-muted-foreground mt-1 truncate">{selectedFile?.name}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-1 hover:bg-background/50 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : null}

                  {pdfError && (
                    <div className="mt-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-destructive">{pdfError}</p>
                    </div>
                  )}

                  {pdfHash && (
                    <div className="mt-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <p className="text-xs font-mono text-blue-600 break-all">
                        Hash: {pdfHash}
                      </p>
                    </div>
                  )}

                  <input
                    id="pdf_url"
                    type="hidden"
                    value={formData.pdf_url}
                    required
                  />
                </div>
              </div>

              {result && (
                <div
                  className={`p-4 rounded-lg flex items-start gap-3 ${result.success
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
                    Đang ký và cấp phát...
                  </>
                ) : pdfUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang tải file...
                  </>
                ) : !formData.pdf_url ? (
                  <>
                    <File className="w-4 h-4 mr-2" />
                    Vui lòng tải lên PDF
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Ký và Cấp phát Chứng chỉ
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="batch">
        <NFTBatchCreate account={account} />
      </TabsContent>
    </Tabs>
  );
};
