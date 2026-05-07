import { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { FileText, Send, Loader2, CheckCircle, AlertCircle, Key, X, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calculateHashHex, signData } from '@/utils/cryptoUtils';
import { decryptPrivateKey } from '@/utils/cryptoVault';
import { calculatePdfHash } from '@/utils/signatureUtils';
import { useStorage, useMintNFT } from '@/hooks';
import { toast } from 'sonner';
import { STORAGE_KEYS } from '@/constants/storage';

interface NFTCreateProps {
  account: string;
}

interface FormValues {
  issuer_id: string;
  student_id: string;
  degree_type: string;
  pdf_url: string;
  pdf_hash: string;
  institution_address: string;
  recipient_address: string;
  password?: string;
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
  const mintMutation = useMintNFT();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadPDF, uploading: pdfUploading } = useStorage();

  const { register, handleSubmit, control, setValue, watch, reset } = useForm<FormValues>({
    defaultValues: {
      recipient_address: account,
    }
  });

  const pdfUrl = watch('pdf_url');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf')) {
      toast.error('Vui lòng chọn file PDF');
      setSelectedFile(null);
      setValue('pdf_url', '');
      setValue('pdf_hash', '');
      return;
    }
    
    setSelectedFile(file);

    try {
      const buffer = await file.arrayBuffer();
      const hash = await calculatePdfHash(buffer);

      toast.info('Đang tải file lên...');
      const url = await uploadPDF(file, {
        folder: 'nft-certificates',
        tags: ['nft', 'certificate'],
      });
      setValue('pdf_url', url);
      setValue('pdf_hash', hash);
      toast.success('Đã tải file lên thành công');
    } catch (error) {
      console.error('File processing failed:', error);
      toast.error('Lỗi xử lý file');
      setSelectedFile(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setValue('pdf_url', '');
    setValue('pdf_hash', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!data.pdf_url) {
      toast.error('Vui lòng tải lên file PDF chứng chỉ');
      return;
    }

    if (!data.password) {
      toast.error('Vui lòng nhập mật khẩu ví để ký số');
      return;
    }

    try {
      const vaultData = localStorage.getItem(STORAGE_KEYS.VAULT);
      if (!vaultData) throw new Error("Không tìm thấy ví trên thiết bị này.");
      
      const vault = JSON.parse(vaultData);
      let privateKey: Uint8Array;
      
      try {
        privateKey = await decryptPrivateKey(vault, data.password);
      } catch (err) {
        throw new Error("Mật khẩu không chính xác.");
      }

      const pdf_hash = calculateHashHex(data.pdf_url + data.degree_type + data.student_id);
      const messageToSign = data.degree_type + data.pdf_url + pdf_hash + data.institution_address;
      const signature = await signData(messageToSign, privateKey);

      mintMutation.mutate({
        ...data,
        pdf_hash,
        signature,
      }, {
        onSuccess: (response) => {
          if (response.success) {
            reset({
              issuer_id: '',
              student_id: '',
              degree_type: '',
              pdf_url: '',
              pdf_hash: '',
              institution_address: '',
              recipient_address: account,
              password: '',
            });
            setSelectedFile(null);
          }
        }
      });
    } catch (error: any) {
      toast.error(error.message || 'Không thể ký số');
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issuer_id">ID Người phát hành</Label>
              <Input
                id="issuer_id"
                placeholder="VD: teacher_001"
                {...register("issuer_id", { required: true })}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student_id">ID Sinh viên</Label>
              <Input
                id="student_id"
                placeholder="VD: STU_001"
                {...register("student_id", { required: true })}
                className="bg-background/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="degree_type">Loại bằng cấp</Label>
            <Controller
              name="degree_type"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
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
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="institution_address">Tổ chức/Trường (Địa chỉ)</Label>
            <Input
              id="institution_address"
              placeholder="VD: Harvard University"
              {...register("institution_address", { required: true })}
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipient_address">Địa chỉ ví Sinh viên</Label>
            <Input
              id="recipient_address"
              placeholder="0x..."
              {...register("recipient_address", { required: true })}
              className="bg-background/50 font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label>Chứng chỉ PDF</Label>
            <div 
              onClick={() => !pdfUploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                selectedFile 
                  ? 'border-primary/50 bg-primary/5' 
                  : 'border-border hover:border-primary/30 hover:bg-secondary/30'
              } ${pdfUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf"
                className="hidden"
              />
              
              {pdfUploading ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Đang tải lên...</p>
                </>
              ) : selectedFile ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{selectedFile.name}</p>
                    <p className="text-[10px] text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }}
                    className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="w-3 h-3 mr-1" /> Gỡ bỏ
                  </Button>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <Upload className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Nhấp để chọn hoặc kéo thả</p>
                    <p className="text-[10px] text-muted-foreground">Chỉ chấp nhận file PDF (tối đa 10MB)</p>
                  </div>
                </>
              )}
            </div>
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
                  {...register("password", { required: true })}
                  className="bg-background/50 pl-10"
                />
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                * Private Key sẽ được giải mã tạm thời để ký dữ liệu và không bao giờ rời khỏi trình duyệt.
              </p>
            </div>
          </div>

          {mintMutation.data && (
            <div
              className={`p-4 rounded-lg flex items-start gap-3 ${
                mintMutation.data.success
                  ? 'bg-success/10 border border-success/30'
                  : 'bg-destructive/10 border border-destructive/30'
              }`}
            >
              {mintMutation.data.success ? (
                <CheckCircle className="w-5 h-5 text-success mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
              )}
              <div>
                <p className={mintMutation.data.success ? 'text-success' : 'text-destructive'}>
                  {mintMutation.data.success ? 'Chứng chỉ số đã được cấp phát và ghi vào Blockchain thành công!' : (mintMutation.data.error || 'Có lỗi xảy ra khi cấp phát chứng chỉ')}
                </p>
                {mintMutation.data.token_id && (
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    Mã số chứng chỉ (Token ID): {mintMutation.data.token_id}
                  </p>
                )}
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={mintMutation.isPending || !pdfUrl || pdfUploading}
            className="w-full from-primary to-accent hover:opacity-90"
          >
            {mintMutation.isPending ? (
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
